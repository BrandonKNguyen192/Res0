import { NextResponse } from "next/server";
import { getSession, orgFromSession } from "@/lib/auth0";
import { appConfig } from "@/lib/config";
import { getStripe } from "@/lib/stripe";
import { ensureOrg } from "@/lib/data";

// Self-serve billing management via the Stripe Customer Portal.
export async function POST(request: Request) {
  if (!appConfig.stripeConfigured) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/auth/login", request.url), 303);
  const claim = orgFromSession(session);
  if (!claim) return NextResponse.redirect(new URL("/dashboard", request.url), 303);

  const org = await ensureOrg(claim.auth0OrgId, claim.orgName);
  if (!org.stripe_customer_id) {
    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  }

  const portal = await getStripe().billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${appConfig.appBaseUrl}/dashboard`,
  });
  return NextResponse.redirect(portal.url, 303);
}
