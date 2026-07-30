import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, getEntitlement } from '@/lib/contract.js';
import { listVenues, seed } from '@/lib/db.js';
import { canView, homeFor } from '@/lib/roles.js';
import { opsFor, money, TONIGHT } from '@/lib/demo.js';
import { computeInsights } from '@/lib/insights.js';
import InsightFeed from '@/components/InsightFeed.jsx';

// The owner's view: every venue, every number. Ops numbers are simulated until
// a POS connector is wired (and say so); venues, publish state and the plan are
// REAL — they come from the store and the entitlement row.
export default async function PortfolioPage() {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  if (!canView(session.role, '/portfolio')) redirect(homeFor(session.role));
  await seed(session.orgId);

  const [venues, entitlement] = await Promise.all([
    listVenues(session.orgId),
    getEntitlement(session.orgId),
  ]);
  const ops = venues.map((v) => ({ venue: v, o: opsFor(v) }));
  const revenue = ops.reduce((n, x) => n + x.o.revenue, 0);
  const covers = ops.reduce((n, x) => n + x.o.covers, 0);
  const avgPrime = ops.length
    ? Math.round(ops.reduce((n, x) => n + x.o.prime, 0) / ops.length)
    : 0;
  const best = ops.length
    ? ops.reduce((a, b) => (b.o.delta > a.o.delta ? b : a))
    : null;

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">{session.orgName}</div>
          <h1>Portfolio</h1>
          <p className="lede">All venues · today</p>
        </div>
        <span className={`pill ${entitlement.status === 'active' ? 'live' : 'draft'}`}>
          {entitlement.status === 'active'
            ? `Subscription active · ${venues.length} of ${entitlement.quantity} venues`
            : 'No subscription'}
        </span>
      </div>

      <div className="sect"><h2>Across all venues</h2><span className="tag-sim">simulated · POS connector pending</span></div>
      <div className="kpis">
        <div className="kpi">
          <div className="l">Revenue today · all venues</div>
          <div className="n">{money(revenue)}</div>
          <div className="delta up">▲ +5% vs avg</div>
        </div>
        <div className="kpi">
          <div className="l">Covers · all venues</div>
          <div className="n">{covers}</div>
          <div className="delta">{venues.length} venue{venues.length === 1 ? '' : 's'}</div>
        </div>
        <div className="kpi">
          <div className="l">Avg prime cost</div>
          <div className="n">{avgPrime}%</div>
          <div className="delta up">▲ in band</div>
        </div>
        <div className="kpi">
          <div className="l">Best performer</div>
          <div className="n" style={{ fontSize: 21 }}>{best ? best.venue.name : '—'}</div>
          <div className="delta up">{best ? `▲ +${best.o.delta}% · ${best.o.covers} covers` : ''}</div>
        </div>
      </div>

      <div className="sect"><h2>Hidden gems &amp; inefficiencies</h2></div>
      <InsightFeed
        title="What the numbers are trying to tell you"
        insights={computeInsights({ venues, ops, entitlement, tonight: TONIGHT }, session.role)}
      />

      <div className="sect"><h2>Your venues</h2><span className="tag-live">tap to drill in</span></div>
      <div className="grid">
        {ops.map(({ venue, o }) => (
          <Link className="card hov" key={venue.id} href={`/venues/${venue.id}`}>
            <div className="spread">
              <div className="name">{venue.name}</div>
              <span className={`pill ${venue.published ? 'live' : 'draft'}`}>
                {venue.published ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="meta">{venue.city || 'No city set'}</div>
            <div className="row">
              <span className="badge ok">Prime {o.prime}% · in band</span>
              <span className={`delta ${o.delta >= 0 ? 'up' : 'down'}`} style={{ marginTop: 0 }}>
                {o.delta >= 0 ? '▲ +' : '▼ '}{o.delta}%
              </span>
            </div>
            <div className="vstats">
              <div><div className="l">Covers</div><div className="n">{o.covers}</div></div>
              <div><div className="l">Revenue</div><div className="n">{money(o.revenue)}</div></div>
              <div><div className="l">Labor %</div><div className="n">{o.laborPct}%</div></div>
              <div><div className="l">Sales / labor hr</div><div className="n">${o.slh}</div></div>
            </div>
          </Link>
        ))}
      </div>
      <p className="notice" style={{ marginTop: 14 }}>
        Venue list, publish state and the plan are live from the store; ops numbers are
        simulated until a POS connector is wired. Add or close venues in the{' '}
        <Link href="/">venue hub</Link> — the subscription follows.
      </p>
    </>
  );
}
