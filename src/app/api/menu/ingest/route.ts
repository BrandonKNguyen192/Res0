import { NextResponse } from "next/server";
import { getSession, orgFromSession } from "@/lib/auth0";
import { appConfig } from "@/lib/config";
import { ensureOrg, getVenue, replaceMenu } from "@/lib/data";
import { extractMenuFromImage } from "@/lib/openrouter";

// Photograph a paper menu → OpenRouter vision → structured menu → guest page.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/auth/login", request.url), 303);
  const claim = orgFromSession(session);
  if (!claim) return NextResponse.redirect(new URL("/dashboard", request.url), 303);

  const form = await request.formData();
  const venueId = String(form.get("venueId") ?? "");
  const photo = form.get("photo");

  const org = await ensureOrg(claim.auth0OrgId, claim.orgName);
  const venue = await getVenue(venueId);
  if (!venue || venue.org_id !== org.id) {
    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  }

  const venueUrl = new URL(`/dashboard/venues/${venue.id}`, appConfig.appBaseUrl);
  if (!(photo instanceof File) || photo.size === 0) {
    venueUrl.searchParams.set("ingest", "err");
    return NextResponse.redirect(venueUrl, 303);
  }

  try {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const mime = photo.type || "image/jpeg";
    const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
    const menu = await extractMenuFromImage(dataUrl);
    await replaceMenu(venue.id, menu);
  } catch (error) {
    console.error("menu ingest failed:", error);
    venueUrl.searchParams.set("ingest", "err");
    return NextResponse.redirect(venueUrl, 303);
  }

  return NextResponse.redirect(venueUrl, 303);
}
