import Link from 'next/link';
import { getSession, getEntitlement, canAddVenue } from '@/lib/contract.js';
import { listVenues, seed } from '@/lib/db.js';
import AddVenue from '@/components/AddVenue.jsx';
import PublishButton from '@/components/PublishButton.jsx';

export default async function VenuesPage() {
  const session = await getSession();
  seed(session.orgId);

  const [entitlement, venues] = await Promise.all([
    getEntitlement(session.orgId),
    Promise.resolve(listVenues(session.orgId)),
  ]);

  // The join: an identity fact and a billing fact, decided together.
  const verdict = canAddVenue(entitlement, venues.length);

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">{session.orgName}</div>
          <h1>Venues</h1>
          <p className="lede">
            Every venue you operate is one unit on the subscription. Open one and the bill
            follows; close one and it follows back.
          </p>
        </div>
        <div className="card" style={{ minWidth: 210, gap: 6 }}>
          <div className="meta">Plan covers</div>
          <div className="row" style={{ alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 34, lineHeight: 1 }}>
              {venues.length}
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

        <AddVenue allowed={verdict.ok} message={verdict.message} count={venues.length} limit={entitlement.quantity} />
      </div>
    </>
  );
}
