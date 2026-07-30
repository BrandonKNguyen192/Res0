import { getStripe } from "./stripe";
import { appConfig } from "./config";
import {
  countActiveVenues,
  setOrgStripeCustomer,
  type OrgRow,
} from "./data";

// The venue is the unit: the subscription has ONE item whose quantity is the
// number of active venues. Adding or closing a venue updates the quantity with
// proration — the bill tracks the business, no renegotiation.
export async function syncVenueQuantity(org: OrgRow): Promise<void> {
  if (!appConfig.stripeConfigured || !org.stripe_subscription_id) return;
  const stripe = getStripe();
  const count = await countActiveVenues(org.id);
  const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id);
  const item = subscription.items.data[0];
  if (!item) return;
  const quantity = Math.max(1, count);
  if (item.quantity === quantity) return;
  await stripe.subscriptions.update(org.stripe_subscription_id, {
    items: [{ id: item.id, quantity }],
    proration_behavior: "create_prorations",
  });
}

export async function ensureStripeCustomer(org: OrgRow): Promise<string> {
  if (org.stripe_customer_id) return org.stripe_customer_id;
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: org.name,
    metadata: { res0_org_id: org.id, auth0_org_id: org.auth0_org_id },
  });
  await setOrgStripeCustomer(org.id, customer.id);
  return customer.id;
}

export function randomIdentifierSuffix(): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += letters[Math.floor(Math.random() * letters.length)];
  }
  return out;
}
