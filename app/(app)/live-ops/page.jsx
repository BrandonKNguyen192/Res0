import { redirect } from 'next/navigation';
import { getSession } from '@/lib/contract.js';
import { listVenues, seed } from '@/lib/db.js';
import { canView, homeFor, scopeVenues } from '@/lib/roles.js';
import { FLOOR } from '@/lib/demo.js';
import { connectorStatus } from '@/lib/connectors.js';
import EightySixBoard from '@/components/EightySixBoard.jsx';

// Real-time floor, kitchen & inventory. Floor KPIs are simulated until a POS
// connector is live; the 86 board is REAL — it edits the venue's stored menu
// and the public guest page follows. Connector rail is owner-only.
export default async function LiveOpsPage() {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  if (!canView(session.role, '/live-ops')) redirect(homeFor(session.role));
  await seed(session.orgId);

  const venues = scopeVenues(session, await listVenues(session.orgId));
  // The board runs on the first venue in scope that has a menu.
  const boardVenue = venues.find((v) => v.menu?.sections?.length) ?? venues[0] ?? null;

  const f = FLOOR;
  const owner = session.role === 'owner';
  const connectors = owner ? connectorStatus() : [];

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">{session.orgName}{session.venueSlug ? ' · your venue' : ''}</div>
          <h1>Live ops</h1>
          <p className="lede">Real-time floor, kitchen &amp; inventory</p>
        </div>
      </div>

      <div className="sect"><h2>On the floor now</h2><span className="tag-sim">simulated · POS connector pending</span></div>
      <div className="kpis">
        <div className="kpi"><div className="l">Seated now</div><div className="n">{f.seated}</div><div className="delta">of {f.booked} booked</div></div>
        <div className="kpi"><div className="l">Open tables</div><div className="n">{f.openTables}</div><div className="delta">waitlist: {f.waitlist}</div></div>
        <div className="kpi"><div className="l">Avg ticket time</div><div className="n">{f.ticketMin} min</div><div className="delta up">▲ under 16 target</div></div>
        <div className="kpi"><div className="l">Labor right now</div><div className="n">{f.laborNow}%</div><div className="delta up">▲ on target</div></div>
        <div className="kpi"><div className="l">Covers vs forecast</div><div className="n">{f.coversVsForecast}</div><div className="delta up">▲ running ahead</div></div>
        <div className="kpi"><div className="l">Voids tonight</div><div className="n" style={{ color: 'var(--red)' }}>${f.voids}</div><div className="delta down">▼ simulated</div></div>
      </div>

      <div className="sect">
        <h2>86 &amp; service watch</h2>
        <span className="tag-live">live from the store — changes hit the guest page</span>
      </div>
      <div className="card">
        <EightySixBoard venue={boardVenue} />
        {boardVenue && (
          <p className="notice">
            {boardVenue.name} · every 86 here rewrites the stored menu and revalidates{' '}
            <code>/m/{boardVenue.slug}</code> — one boundary, so a floor decision reaches the
            public surface immediately.
          </p>
        )}
      </div>

      {owner && (
        <>
          <div className="sect"><h2>Connected systems</h2><span className="tag-live">from /api/connectors</span></div>
          <div className="congrid">
            {connectors.map((c) => (
              <div className="conn" key={c.name}>
                <div>
                  <div className="cn">{c.name}</div>
                  <div className="ck">{c.kind}</div>
                </div>
                <div className="cact row" style={{ gap: 8 }}>
                  <span className={`badge ${c.live ? 'ok' : 'warn'}`}>{c.live ? 'Live' : 'Simulated'}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="notice" style={{ marginTop: 10 }}>
            Plug-and-play: each connector goes live the moment its key lands in the env
            (<code>SQUARE_ACCESS_TOKEN</code>, <code>BISTROCHAT_API_KEY</code>, …) — status is
            computed from key presence, and values never leave the server.
          </p>
        </>
      )}
    </>
  );
}
