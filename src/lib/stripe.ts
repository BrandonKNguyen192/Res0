import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set — run `stripe projects env --pull`.");
  }
  if (!client) {
    // No apiVersion override: the SDK pins its own current version.
    client = new Stripe(key);
  }
  return client;
}
