import { getSession, getEntitlement } from '@/lib/contract.js';
import { listVenues, seed } from '@/lib/db.js';

// ── B OWNS THIS PAGE ─────────────────────────────────────────────────────────
// The shape is here so the core app has somewhere to send an operator who hits the paywall.
// Two things to wire, and nothing else on this page needs to change:
//
//   1. "Add a venue to the plan" → a Checkout session for quantity = venues.length + 1
//   2. "Manage billing" → a Stripe Customer Portal session for entitlement.customerId
//
// Read subscription state through getEntitlement() in lib/contract.js — do not call Stripe
// directly from a page render. The webhook is the source of truth; this only displays it.

export default async function BillingPage() {
  const session = await getSession();
  seed(session.orgId);

  const entitlement = await getEntitlement(session.orgId);
  const venues = listVenues(session.orgId);
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
          <div style={{ fontFamily: 'var(--serif)', fontSize: 34, lineHeight: 1 }}>
            {venues.length} <span style={{ fontSize: 16, color: 'var(--ink-3)' }}>of {entitlement.quantity}</span>
          </div>
          <div className="meta">$29 per venue, per month</div>
        </div>

        <div className="card">
          <div className="meta">Change the plan</div>
          {/* B: replace these with real Checkout / Portal redirects. */}
          <button className="btn primary" disabled>Add a venue to the plan</button>
          <button className="btn" disabled>Manage billing</button>
          <div className="notice">Stripe Checkout and the Customer Portal wire in here.</div>
        </div>
      </div>
    </>
  );
}
