"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, orgFromSession } from "@/lib/auth0";
import { appConfig } from "@/lib/config";
import { canPublish } from "@/lib/entitlement";
import { syncVenueQuantity } from "@/lib/billing";
import {
  countActiveVenues,
  createVenue,
  deactivateVenue,
  ensureOrg,
  getVenue,
  replaceMenu,
  setVenuePublished,
  type OrgRow,
} from "@/lib/data";
import type { ExtractedMenu } from "@/lib/openrouter";

async function requireOrg(): Promise<OrgRow> {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  const claim = orgFromSession(session);
  if (!claim) redirect("/dashboard");
  if (!appConfig.dbConfigured) redirect("/dashboard");
  return ensureOrg(claim.auth0OrgId, claim.orgName);
}

async function requireVenue(org: OrgRow, venueId: string) {
  const venue = await getVenue(venueId);
  if (!venue || venue.org_id !== org.id) redirect("/dashboard");
  return venue;
}

export async function addVenue(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/dashboard");
  await createVenue(org.id, name);
  // The bill tracks the number of active venues.
  await syncVenueQuantity(org);
  revalidatePath("/dashboard");
}

export async function closeVenue(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const venue = await requireVenue(org, String(formData.get("venueId") ?? ""));
  await deactivateVenue(venue.id);
  await syncVenueQuantity(org);
  revalidatePath("/dashboard");
}

export async function togglePublish(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const venue = await requireVenue(org, String(formData.get("venueId") ?? ""));
  const publish = formData.get("publish") === "true";
  if (publish) {
    const activeCount = await countActiveVenues(org.id);
    if (!canPublish(org, activeCount)) {
      // Entitlement is an identity fact — no live subscription, no guest page.
      redirect(`/dashboard/venues/${venue.id}?blocked=1`);
    }
  }
  await setVenuePublished(venue.id, publish);
  revalidatePath(`/dashboard/venues/${venue.id}`);
  revalidatePath(`/m/${venue.slug}`);
  redirect(`/dashboard/venues/${venue.id}`);
}

const SAMPLE_MENU: ExtractedMenu = {
  sections: [
    {
      name: "Small plates",
      items: [
        { name: "Charred padrón peppers", description: "smoked salt, lemon", price: 9 },
        { name: "Crispy pork belly bites", description: "tamarind glaze, herbs", price: 14 },
        { name: "Burrata", description: "heirloom tomato, basil oil", price: 16 },
      ],
    },
    {
      name: "Mains",
      items: [
        { name: "Khao soi", description: "chicken, pickled mustard greens", price: 21 },
        { name: "Grilled hanger steak", description: "jaew, sticky rice", price: 34 },
        { name: "Whole roasted branzino", description: "lemongrass, chili-lime", price: 38 },
      ],
    },
    {
      name: "Dessert",
      items: [
        { name: "Mango sticky rice", description: "salted coconut cream", price: 11 },
        { name: "Burnt basque cheesecake", price: 12 },
      ],
    },
  ],
};

export async function seedSampleMenu(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const venue = await requireVenue(org, String(formData.get("venueId") ?? ""));
  await replaceMenu(venue.id, SAMPLE_MENU);
  revalidatePath(`/dashboard/venues/${venue.id}`);
  revalidatePath(`/m/${venue.slug}`);
  redirect(`/dashboard/venues/${venue.id}`);
}
