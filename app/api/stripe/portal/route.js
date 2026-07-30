import { NextResponse } from 'next/server';
import { getSession } from '@/lib/contract.js';
import { getStripe } from '@/lib/stripe.js';
import { getEntitlementRow } from '@/lib/db.js';

// Self-serve billing via the Stripe Customer Portal (enable it in the Dashboard, test mode).
export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe is not configured yet.' }, { status: 503 });
  }
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL('/auth/login', request.url), 303);

  const base = process.env.APP_BASE_URL || 'http://localhost:3000';
  const row = await getEntitlementRow(session.orgId);
  if (!row?.customerId) return NextResponse.redirect(new URL('/billing', base), 303);

  const portal = await getStripe().billingPortal.sessions.create({
    customer: row.customerId,
    return_url: `${base}/billing`,
  });
  return NextResponse.redirect(portal.url, 303);
}
