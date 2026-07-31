// Reusable one-time payment Checkout Session utility.
// Any feature that needs a paywall imports this instead of talking to Stripe directly.
// The webhook (app/api/stripe/webhook) dispatches on metadata.type to confirm payment.

import { getStripe } from '@/lib/stripe.js';

/**
 * Create a Checkout Session for a one-time payment.
 *
 * @param {object} opts
 * @param {string} opts.orgId          — the Auth0 org that owns this payment
 * @param {number} opts.amount         — in cents (Stripe's unit)
 * @param {string} opts.description    — what shows in the Checkout form
 * @param {string} opts.referenceType  — discriminator for the webhook (e.g. 'supplies')
 * @param {string} opts.referenceId    — entity id the webhook will act on
 * @param {string} [opts.customerId]   — existing Stripe customer, if known
 * @param {object} [opts.extraMetadata] — additional metadata to attach
 * @returns {Promise<{url:string, sessionId:string}>}
 */
export async function createPaymentCheckout({
  orgId,
  amount,
  description,
  referenceType,
  referenceId,
  customerId,
  extraMetadata = {},
}) {
  const stripe = getStripe();
  const base = process.env.APP_BASE_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: orgId,
    ...(customerId ? { customer: customerId } : {}),
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: description },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: referenceType,
      reference_id: referenceId,
      org_id: orgId,
      ...extraMetadata,
    },
    success_url: `${base}/${referenceType}?order=${referenceId}&paid=success`,
    cancel_url: `${base}/${referenceType}?order=${referenceId}&paid=cancelled`,
  });

  return { url: session.url, sessionId: session.id };
}
