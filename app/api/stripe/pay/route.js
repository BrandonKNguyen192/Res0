import { NextResponse } from 'next/server';
import { getSession } from '@/lib/contract.js';
import { stripePaymentsReady } from '@/lib/stripe.js';
import { createPaymentCheckout } from '@/lib/paywall.js';
import { createOrder } from '@/lib/supplies.js';

// Creates an order + Stripe Checkout Session in one request and returns the
// checkout URL for the client to navigate to.
// POST body: { items: [{ id: 's1', quantity: 2 }, ...] }
export async function POST(request) {
  if (!stripePaymentsReady) {
    return NextResponse.json({ error: 'Stripe is not configured yet.' }, { status: 503 });
  }

  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL('/auth/login', request.url), 303);
  if (session.role !== 'owner' && session.role !== 'general_manager') {
    return NextResponse.json({ error: 'Your role cannot reorder supplies.' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Order must have at least one item.' }, { status: 400 });
  }
  for (const item of items) {
    if (!item.id || typeof item.quantity !== 'number' || item.quantity < 1) {
      return NextResponse.json({ error: 'Each item needs a valid id and quantity.' }, { status: 400 });
    }
  }

  const order = createOrder(session.orgId, items);
  const amount = Math.round(order.total * 100);
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  const { url } = await createPaymentCheckout({
    orgId: session.orgId,
    amount,
    description: `Supply reorder — ${itemCount} item${itemCount === 1 ? '' : 's'}`,
    referenceType: 'supplies',
    referenceId: order.id,
  });

  return NextResponse.json({ url, orderId: order.id });
}
