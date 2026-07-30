import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  getOrgById,
  getOrgByStripeCustomer,
  setOrgSubscription,
  type OrgRow,
} from "@/lib/data";

// Subscription state flows back into identity here: the webhook is the ONLY
// writer of subscription_status and licensed_venues. Signature verification is
// mandatory — this endpoint is excluded from the auth middleware on purpose.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const checkout = event.data.object as Stripe.Checkout.Session;
      const orgId = checkout.client_reference_id;
      const subscriptionId =
        typeof checkout.subscription === "string"
          ? checkout.subscription
          : checkout.subscription?.id;
      if (orgId && subscriptionId) {
        const org = await getOrgById(orgId);
        if (org) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
          await applySubscription(org, subscription);
        }
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
      const org = await getOrgByStripeCustomer(customerId);
      if (org) await applySubscription(org, subscription);
      break;
    }
    // invoice.payment_failed needs no handler: Stripe moves the subscription to
    // past_due, which arrives via customer.subscription.updated above.
  }

  return NextResponse.json({ received: true });
}

async function applySubscription(org: OrgRow, subscription: Stripe.Subscription) {
  const quantity = subscription.items.data[0]?.quantity ?? 0;
  const gone = subscription.status === "canceled";
  await setOrgSubscription(
    org.id,
    gone ? null : subscription.id,
    gone ? "canceled" : subscription.status,
    gone ? 0 : quantity,
  );
}
