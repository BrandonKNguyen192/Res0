import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSession, orgFromSession } from "@/lib/auth0";
import { appConfig } from "@/lib/config";
import { getStripe } from "@/lib/stripe";
import { ensureStripeCustomer, randomIdentifierSuffix } from "@/lib/billing";
import { countActiveVenues, ensureOrg } from "@/lib/data";

// Starts the subscription: one Checkout Session, quantity = active venues.
export async function POST(request: Request) {
  if (!appConfig.stripeConfigured || !appConfig.stripePriceConfigured) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/auth/login", request.url), 303);
  const claim = orgFromSession(session);
  if (!claim) return NextResponse.redirect(new URL("/dashboard", request.url), 303);

  const org = await ensureOrg(claim.auth0OrgId, claim.orgName);
  const customerId = await ensureStripeCustomer(org);
  const quantity = Math.max(1, await countActiveVenues(org.id));

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    customer: customerId,
    client_reference_id: org.id,
    // NO payment_method_types — Stripe decides dynamically (see stripe-best-practices).
    line_items: [{ price: process.env.STRIPE_PRICE_VENUE_MONTHLY!, quantity }],
    subscription_data: {
      metadata: { res0_org_id: org.id, auth0_org_id: org.auth0_org_id },
    },
    success_url: `${appConfig.appBaseUrl}/dashboard?checkout=success`,
    cancel_url: `${appConfig.appBaseUrl}/dashboard?checkout=cancelled`,
  };
  // Tags the session for flow tracking in the Dashboard (API 2026-03-25.dahlia+).
  (params as Record<string, unknown>).integration_identifier =
    `res0_checkout_${randomIdentifierSuffix()}`;

  const checkout = await getStripe().checkout.sessions.create(params);
  return NextResponse.redirect(checkout.url!, 303);
}
