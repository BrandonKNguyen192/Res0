import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe.js';
import { saveEntitlementRow } from '@/lib/db.js';

// Subscription state flows back into identity here. This route is the ONLY writer of the
// entitlements row that getEntitlement() reads — the redirect back from Checkout never is.
// Signature verification is mandatory; the route is excluded from the auth middleware because
// Stripe, not a member, is the caller.
//
// Local dev: stripe listen --forward-to localhost:3000/api/stripe/webhook
export async function POST(request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET is not set.' }, { status: 503 });
  }
  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });

  const body = await request.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const checkout = event.data.object;
      const orgId = checkout.client_reference_id;
      const subId =
        typeof checkout.subscription === 'string' ? checkout.subscription : checkout.subscription?.id;
      if (orgId && subId) {
        const sub = await getStripe().subscriptions.retrieve(subId);
        await persist(orgId, sub);
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      // org_id travels on subscription metadata (set at checkout) — the org owns the
      // subscription, so the webhook needs no session and no user.
      const orgId = sub.metadata?.org_id;
      if (orgId) await persist(orgId, sub);
      break;
    }
    // invoice.payment_failed needs no handler: Stripe moves the subscription to past_due,
    // which arrives via customer.subscription.updated above.
  }

  return NextResponse.json({ received: true });
}

const STATUS = { active: 'active', trialing: 'active', past_due: 'past_due' };

async function persist(orgId, sub) {
  const item = sub.items?.data?.[0];
  const end = sub.current_period_end ?? item?.current_period_end ?? null;
  const gone = sub.status === 'canceled';
  await saveEntitlementRow(orgId, {
    status: gone ? 'none' : STATUS[sub.status] ?? 'none',
    quantity: gone ? 0 : item?.quantity ?? 0,
    periodEnd: end
      ? new Date(end * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : null,
    customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null,
    subscriptionId: gone ? null : sub.id,
  });
}
