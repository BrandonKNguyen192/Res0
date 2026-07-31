import { NextResponse } from 'next/server';
import { getSession } from '@/lib/contract.js';
import { stripeReady } from '@/lib/stripe.js';
import { createPaymentCheckout } from '@/lib/paywall.js';
import { getOrder } from '@/lib/supplies.js';

// Creates a Checkout Session for a pending order and redirects to Stripe.
// Called via form POST from the supplies page (the browser follows the 303 redirect).
export async function POST(request) {
  if (!stripeReady) {
    return NextResponse.json({ error: 'Stripe is not configured yet.' }, { status: 503 });
  }

  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL('/auth/login', request.url), 303);
  if (session.role !== 'owner' && session.role !== 'general_manager') {
    return NextResponse.json({ error: 'Your role cannot reorder supplies.' }, { status: 403 });
  }

  const fd = await request.formData();
  const orderId = fd.get('orderId');
  if (!orderId || typeof orderId !== 'string') {
    return NextResponse.json({ error: 'Missing orderId.' }, { status: 400 });
  }

  const order = getOrder(session.orgId, orderId);
  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }
  if (order.status !== 'pending') {
    return NextResponse.json({ error: 'Order is already paid or cancelled.' }, { status: 400 });
  }

  const amount = Math.round(order.total * 100);
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  const { url } = await createPaymentCheckout({
    orgId: session.orgId,
    amount,
    description: `Supply reorder — ${itemCount} item${itemCount === 1 ? '' : 's'}`,
    referenceType: 'supplies',
    referenceId: order.id,
  });

  return NextResponse.redirect(url, 303);
}
