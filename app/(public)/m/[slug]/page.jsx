import { notFound } from 'next/navigation';
import { getVenueBySlug, seed, usingNeon } from '@/lib/db.js';
import { DEMO_ORG } from '@/lib/contract.js';

// The public guest menu. No session — this is the surface a diner sees, and it is the thing
// the subscription actually protects: an unpublished venue is not reachable here at all.
export default async function GuestMenu({ params }) {
  const { slug } = await params;
  // Memory mode resets on restart, so re-seed the demo org; with Neon the real org's data
  // persists and a public hit must never write demo rows into the database.
  if (!usingNeon) await seed(DEMO_ORG);

  const venue = await getVenueBySlug(slug);
  if (!venue || !venue.published || !venue.menu) notFound();

  const m = venue.menu;

  return (
    <div className="menu-page">
      <div className="menu-in">
        <header className="menu-head">
          <h1>{m.title || venue.name}</h1>
          {m.subtitle && <div className="sub">{m.subtitle}</div>}
        </header>

        {(m.sections || []).map((sec, i) => (
          <section className="menu-sec" key={i}>
            <h2>{sec.name}</h2>
            {(sec.items || []).map((item, j) => (
              <div className="dish" key={j}>
                <div>
                  <div className="d-name">{item.name}</div>
                  {item.desc && <div className="d-desc">{item.desc}</div>}
                </div>
                {item.price && <div className="d-price">{item.price}</div>}
              </div>
            ))}
          </section>
        ))}

        <p className="notice" style={{ textAlign: 'center', marginTop: 56 }}>
          {venue.city ? `${venue.name} · ${venue.city}` : venue.name}
        </p>
      </div>
    </div>
  );
}
