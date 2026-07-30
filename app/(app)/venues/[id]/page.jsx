import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession, getEntitlement, canPublish } from '@/lib/contract.js';
import { getVenue, seed } from '@/lib/db.js';
import { canView, homeFor } from '@/lib/roles.js';
import MenuBuilder from '@/components/MenuBuilder.jsx';
import PublishButton from '@/components/PublishButton.jsx';

export default async function VenuePage({ params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/auth/login');
  if (!canView(session.role, '/')) redirect(homeFor(session.role));
  await seed(session.orgId);

  const venue = await getVenue(session.orgId, id);
  if (!venue) notFound();
  // Venue-scoped roles can only open their own venue — not-found, never a 403,
  // so the URL doesn't confirm what exists outside their scope.
  if (session.venueSlug && venue.slug !== session.venueSlug) notFound();

  const entitlement = await getEntitlement(session.orgId);
  const publishable = canPublish(entitlement);
  const m = venue.menu;

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">
            <Link href="/" style={{ color: 'inherit' }}>Venues</Link>
          </div>
          <h1>{venue.name}</h1>
          <p className="lede">{venue.city || 'No city set'} · /m/{venue.slug}</p>
        </div>
        <div className="row">
          <span className={`pill ${venue.published ? 'live' : 'draft'}`}>
            {venue.published ? 'Published' : 'Draft'}
          </span>
          {venue.published
            ? <Link className="btn" href={`/m/${venue.slug}`}>View guest menu</Link>
            : <PublishButton venueId={venue.id} hasMenu={Boolean(m)} />}
        </div>
      </div>

      {!publishable && (
        <div className="gate" style={{ marginBottom: 22 }}>
          <span className="pill brass">Publishing is gated</span>
          <p>This group has no active subscription, so the guest page stays private. Publishing follows the subscription — it is the same fact, read in a different place.</p>
          <Link className="btn primary" href="/billing">See the plan</Link>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        <MenuBuilder venueId={venue.id} hasMenu={Boolean(m)} />

        {m ? (
          <div className="card">
            <div className="spread">
              <div className="name">{m.title}</div>
              <span className="meta">{(m.sections || []).reduce((n, s) => n + (s.items?.length || 0), 0)} dishes</span>
            </div>
            {(m.sections || []).map((sec, i) => (
              <div key={i} style={{ marginTop: 10 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>{sec.name}</div>
                {(sec.items || []).map((item, j) => (
                  <div className="dish" key={j}>
                    <div>
                      <div className="d-name">{item.name}</div>
                      {item.desc && <div className="d-desc">{item.desc}</div>}
                    </div>
                    {item.price && <div className="d-price">{item.price}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="blocked">
            <div style={{ color: 'var(--color-ink)', fontWeight: 400 }}>No menu yet</div>
            <div className="notice">Photograph the printed menu and it builds itself.</div>
          </div>
        )}
      </div>
    </>
  );
}
