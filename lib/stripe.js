import Stripe from 'stripe';

// B's lane. `stripeReady` gates the billing buttons; getStripe() is lazy so a
// credential-less boot never constructs a client.
export const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);

// For one-time payment Checkout Sessions (supplies, etc.) that use dynamic
// price_data — no STRIPE_PRICE_ID required.
export const stripePaymentsReady = Boolean(process.env.STRIPE_SECRET_KEY);

let client = null;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set.');
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}
