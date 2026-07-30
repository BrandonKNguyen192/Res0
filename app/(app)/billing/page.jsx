import { redirect } from 'next/navigation';
import { getSession, getEntitlement } from '@/lib/contract.js';
import { listVenues, seed } from '@/lib/db.js';
import { stripeReady } from '@/lib/stripe.js';

// ── B OWNS THIS PAGE ─────────────────────────────────────────────────────────
// Both buttons are WIRED: they post to /api/stripe/checkout and /api/stripe/portal, which
// redirect out to Stripe. Checkout covers quantity = venues.length + 1 (or does a prorated
// quantity change if a subscription already exists).
//
// Subscription state still comes only through getEntitlement() — the webhook
// (app/api/stripe/webhook) is the source of truth; this page only displays it.

export default async function BillingPage({ searchParams }) {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  // Billing is the owner's — the subscription belongs to the org, and only the
  // owner role touches it. Role comes from the token, enforced here.
  if (session.role !== 'owner') redirect('/');
  await seed(session.orgId);

  const flags = await searchParams;
  const entitlement = await getEntitlement(session.orgId);
  const venues = await listVenues(session.orgId);
  const active = entitlement.status === 'active';

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">{session.orgName}</div>
          <h1>Billing</h1>
          <p className="lede">
            One subscription for the group, one unit per venue. The subscription belongs to the
            organisation, not to whoever happened to sign up.
          </p>
        </div>
      </div>

      {flags?.checkout === 'success' && (
        <div className="notice" style={{ marginBottom: 18 }}>
          Payment confirmed. The webhook flips entitlement — instant with{' '}
          <code>stripe listen</code> running.
        </div>
      )}
      {flags?.upgraded && (
        <div className="notice" style={{ marginBottom: 18 }}>
          Plan updated with proration — one more venue is covered.
        </div>
      )}

      <div className="grid">
        <div className="card">
          <div className="meta">Status</div>
          <div className="row" style={{ gap: 10 }}>
            <span className={`pill ${active ? 'live' : 'draft'}`}>
              {active ? 'Active' : 'No subscription'}
            </span>
          </div>
          <div className="meta">
            {entitlement.periodEnd ? `Renews ${entitlement.periodEnd}` : 'Renewal date appears once Stripe is connected.'}
          </div>
        </div>

        <div className="card">
          <div className="meta">Venues on the plan</div>
          <div style={{ fontFamily: 'var(--font-editorial-new)', fontSize: 34, lineHeight: 1 }}>
            {venues.length} <span style={{ fontSize: 16, color: 'var(--color-voltage-blue)' }}>of {entitlement.quantity}</span>
          </div>
          <div className="meta">$29 per venue, per month</div>
        </div>

        <div className="card">
          <div className="meta">Change the plan</div>
          {stripeReady ? (
            <>
              <form action="/api/stripe/checkout" method="post">
                <button className="btn primary" type="submit">Add a venue to the plan</button>
              </form>
              {entitlement.customerId ? (
                <form action="/api/stripe/portal" method="post">
                  <button className="btn" type="submit">Manage billing</button>
                </form>
              ) : (
                <button className="btn" disabled>Manage billing</button>
              )}
              <div className="notice">
                Checkout covers every current venue plus the next one. The webhook — not the
                redirect — is what unlocks the app.
              </div>
            </>
          ) : (
            <>
              <button className="btn primary" disabled>Add a venue to the plan</button>
              <button className="btn" disabled>Manage billing</button>
              <div className="notice">
                Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID and these go live.
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
