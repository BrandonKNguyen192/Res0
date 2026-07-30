import { redirect } from 'next/navigation';
import { getSession } from '@/lib/contract.js';
import { seed } from '@/lib/db.js';
import { canView, homeFor } from '@/lib/roles.js';
import { FLOOR, WATCH, CONNECTORS } from '@/lib/demo.js';
import EightySix from '@/components/EightySix.jsx';

// Real-time floor, kitchen & inventory. Every role that works a service sees
// this; the connector rail at the bottom is owner-only (it's platform config,
// not tonight's work).
export default async function LiveOpsPage() {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  if (!canView(session.role, '/live-ops')) redirect(homeFor(session.role));
  await seed(session.orgId);

  const f = FLOOR;
  const owner = session.role === 'owner';

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
        <div className="kpi risk"><div className="l">Voids tonight</div><div className="n" style={{ color: 'var(--red)' }}>${f.voids}</div><div className="delta down">▼ simulated</div></div>
      </div>

      <div className="sect"><h2>86 &amp; service watch</h2><span className="tag-live">tap to 86 / restore</span></div>
      <div className="card">
        <EightySix items={WATCH} />
        <p className="notice">
          86ing here pulls the dish from the venue&rsquo;s published guest menu — one boundary,
          so a floor decision reaches the public surface.
        </p>
      </div>

      {owner && (
        <>
          <div className="sect"><h2>Connected systems</h2><span className="tag-sim">from /api/connectors · roadmap</span></div>
          <div className="congrid">
            {CONNECTORS.map((c) => (
              <div className="conn" key={c.name}>
                <div>
                  <div className="cn">{c.name}</div>
                  <div className="ck">{c.kind}</div>
                </div>
                <div className="cact row" style={{ gap: 8 }}>
                  <span className={`badge ${c.tier === 'Open API' ? 'ok' : 'warn'}`}>{c.tier}</span>
                  <button className="btn" type="button" disabled title="Connector wiring is post-hackathon roadmap">
                    Connect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
