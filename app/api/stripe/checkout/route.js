import { NextResponse } from 'next/server';
import { getSession } from '@/lib/contract.js';
import { getStripe, stripeReady } from '@/lib/stripe.js';
import { getEntitlementRow, listVenues, saveEntitlementRow } from '@/lib/db.js';

// "Add a venue to the plan." Two shapes, one button:
//   no subscription yet → Checkout Session covering every current venue plus the next one
//   already subscribed  → a quantity change with proration, no checkout at all
// Either way the webhook is what flips entitlement — the redirect is just a ride home.
export async function POST(request) {
  if (!stripeReady) {
    return NextResponse.json({ error: 'Stripe is not configured yet.' }, { status: 503 });
  }
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL('/auth/login', request.url), 303);

  const stripe = getStripe();
  const base = process.env.APP_BASE_URL || 'http://localhost:3000';
  const venues = await listVenues(session.orgId);
  const quantity = venues.length + 1;
  const row = await getEntitlementRow(session.orgId);

  if (row?.subscriptionId && row.status === 'active') {
    const sub = await stripe.subscriptions.retrieve(row.subscriptionId);
    const item = sub.items.data[0];
    await stripe.subscriptions.update(sub.id, {
      items: [{ id: item.id, quantity }],
      proration_behavior: 'create_prorations',
    });
    // Optimistic write so the gate lifts instantly; the webhook confirms it.
    await saveEntitlementRow(session.orgId, { ...row, quantity });
    return NextResponse.redirect(new URL('/billing?upgraded=1', base), 303);
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    client_reference_id: session.orgId,
    ...(row?.customerId ? { customer: row.customerId } : {}),
    // NO payment_method_types — Stripe chooses dynamically from Dashboard settings.
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity }],
    subscription_data: { metadata: { org_id: session.orgId } },
    success_url: `${base}/billing?checkout=success`,
    cancel_url: `${base}/billing?checkout=cancelled`,
  });
  return NextResponse.redirect(checkout.url, 303);
}
