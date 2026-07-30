import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, getEntitlement, canAddVenue } from '@/lib/contract.js';
import { listVenues, seed } from '@/lib/db.js';
import { canView, homeFor, scopeVenues } from '@/lib/roles.js';
import AddVenue from '@/components/AddVenue.jsx';
import PublishButton from '@/components/PublishButton.jsx';

export default async function VenuesPage() {
  const session = await getSession();
  if (!session) redirect('/auth/login'); // only reachable once Auth0 is live
  if (!canView(session.role, '/')) redirect(homeFor(session.role));
  await seed(session.orgId);

  const [entitlement, allVenues] = await Promise.all([
    getEntitlement(session.orgId),
    listVenues(session.orgId),
  ]);
  // A GM sees their venue; the owner sees the portfolio. Scope is a token fact.
  const venues = scopeVenues(session, allVenues);

  // The join: an identity fact and a billing fact, decided together.
  // The count is the ORG's venue count — scope narrows what you see,
  // never what the plan covers.
  const verdict = canAddVenue(entitlement, allVenues.length);

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">{session.orgName}{session.venueSlug ? ' · your venue' : ''}</div>
          <h1>Venue hub</h1>
          <p className="lede">
            Every venue you operate is one unit on the subscription. Open one and the bill
            follows; close one and it follows back.
          </p>
        </div>
        <div className="card" style={{ minWidth: 210, gap: 6 }}>
          <div className="meta">Plan covers</div>
          <div className="row" style={{ alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 34, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {allVenues.length}
            </span>
            <span className="meta">of {entitlement.quantity} venues</span>
          </div>
          <span className={`pill ${entitlement.status === 'active' ? 'live' : 'draft'}`}>
            {entitlement.status === 'active' ? 'Subscription active' : 'No subscription'}
          </span>
        </div>
      </div>

      <div className="grid">
        {venues.map((v) => (
          <div className="card" key={v.id}>
            <div className="spread">
              <div className="name">{v.name}</div>
              <span className={`pill ${v.published ? 'live' : 'draft'}`}>
                {v.published ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="meta">{v.city || 'No city set'}</div>
            <div className="row" style={{ marginTop: 'auto', paddingTop: 8 }}>
              {v.published ? (
                <Link className="btn" href={`/m/${v.slug}`}>View guest menu</Link>
              ) : (
                <PublishButton venueId={v.id} hasMenu={Boolean(v.menu)} />
              )}
              <Link className="btn" href={`/venues/${v.id}`}>Menu</Link>
            </div>
          </div>
        ))}

        <AddVenue allowed={verdict.ok} message={verdict.message} count={allVenues.length} limit={entitlement.quantity} />
      </div>
    </>
  );
}
