import { redirect } from 'next/navigation';
import { getSession } from '@/lib/contract.js';
import { seed } from '@/lib/db.js';
import { canView, homeFor } from '@/lib/roles.js';
import { BEVERAGE } from '@/lib/demo.js';
import GlassList from '@/components/GlassList.jsx';

// The beverage director's program view — pours, the by-the-glass window, and
// the cellar's own 86 board. Owner sees it too; nobody else does.
export default async function BeveragePage() {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  if (!canView(session.role, '/beverage')) redirect(homeFor(session.role));
  await seed(session.orgId);

  const b = BEVERAGE;

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">{session.orgName}</div>
          <h1>Beverage program</h1>
          <p className="lede">Pours, the by-the-glass window, and what the cellar is telling you</p>
        </div>
      </div>

      <div className="sect"><h2>Tonight&rsquo;s pours</h2><span className="tag-sim">simulated · POS connector pending</span></div>
      <div className="kpis">
        {b.kpis.map((k) => (
          <div className="kpi" key={k.l}>
            <div className="l">{k.l}</div>
            <div className="n" style={{ fontSize: k.n.length > 6 ? 21 : 27 }}>{k.n}</div>
            <div className={`delta ${k.up ? 'up' : ''}`}>{k.up ? '▲ ' : ''}{k.d}</div>
          </div>
        ))}
      </div>

      <div className="sect"><h2>By the glass</h2><span className="tag-live">toggles push to the guest menu</span></div>
      <div className="card">
        <GlassList items={b.glassList} />
      </div>

      <div className="sect"><h2>Cellar watch</h2></div>
      <div className="card">
        <div className="w86">
          {b.watch.map((w) => (
            <div className={`wrow ${w.state === 'out' ? 'out' : 'low'}`} key={w.name}>
              <span className="wdot" />
              <div>
                <div className="wname">{w.name}</div>
                <div className="wnote">{w.note}</div>
              </div>
              <div className="wact">
                <span className={`badge ${w.state === 'out' ? 'no' : 'warn'}`}>{w.state === 'out' ? "86'd" : 'Low'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
