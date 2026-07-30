import { redirect } from 'next/navigation';
import { getSession } from '@/lib/contract.js';
import { listVenues, seed } from '@/lib/db.js';
import { canView, homeFor, scopeVenues } from '@/lib/roles.js';
import { TONIGHT, money } from '@/lib/demo.js';

// Tonight, at a glance. Owner sees every venue; a GM or server arrives pinned
// to their own (the venue scope is an identity fact — it rides the token).
// Management economics (labor) are owner/GM only; a server gets the book.
export default async function TodayPage() {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  if (!canView(session.role, '/today')) redirect(homeFor(session.role));
  await seed(session.orgId);

  const venues = scopeVenues(session, await listVenues(session.orgId));
  const manager = session.role === 'owner' || session.role === 'general_manager';
  const t = TONIGHT;

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">{session.orgName}</div>
          <h1>Today</h1>
          <p className="lede">Friday · service opens at sundown · {t.book.covers} covers on the books</p>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 18 }}>
        {venues.map((v, i) => (
          <span key={v.id} className={`chip ${i === 0 ? 'on' : ''}`}>{v.name}{i === 0 && !session.venueSlug ? ' · pilot' : ''}</span>
        ))}
        {!session.venueSlug && <span className="chip">All venues</span>}
        {session.venueSlug && <span className="notice">pinned to your venue — scope comes from the token</span>}
      </div>

      {manager && (
        <>
          <div className="sect"><h2>Labor — right now</h2><span className="tag-sim">simulated · 7shifts connector pending</span></div>
          <div className="card" style={{ marginBottom: 22 }}>
            <div className="spread" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
              <div style={{ minWidth: 220 }}>
                <div className="eyebrow">Labor % of sales · live</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                    {t.laborLive}%
                  </span>
                  <span className="notice">/ {t.laborGoal}% goal</span>
                </div>
                <p className="notice" style={{ marginTop: 6 }}>Recalculates live as you edit tonight&rsquo;s schedule.</p>
                <span className="badge ok" style={{ marginTop: 10 }}>On target · −1.0 pts vs goal</span>
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div className="eyebrow">Optimal labor variance</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 8 }}>
                  {t.varianceHrs} hrs
                </div>
                <div className="vartrack"><span className="tick" style={{ left: `${t.variancePos * 100}%` }} /></div>
                <div className="varlabels"><span>−10</span><span>on target</span><span>+10</span></div>
                <p className="notice" style={{ marginTop: 6 }}>Overtime <b>{t.overtimeHrs} hrs</b></p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="sect"><h2>Tonight at a glance</h2><span className="tag-sim">simulated</span></div>
      <div className="kpis">
        <div className="kpi"><div className="l">Covers tonight</div><div className="n">{t.covers}</div><div className="delta up">▲ simulated</div></div>
        {manager && (
          <div className="kpi"><div className="l">Revenue today</div><div className="n">{money(t.revenue)}</div><div className="delta up">▲ simulated</div></div>
        )}
        {manager && (
          <div className="kpi"><div className="l">Avg check</div><div className="n">${t.avgCheck}</div><div className="delta">simulated</div></div>
        )}
        <div className="kpi"><div className="l">Top pour</div><div className="n" style={{ fontSize: 21 }}>{t.topPour}</div><div className="delta">{t.topPourNote} · simulated</div></div>
        <div className="kpi"><div className="l">Repeat guests</div><div className="n">{t.repeatGuests}%</div><div className="delta up">▲ +2pts vs Q1</div></div>
        <div className="kpi"><div className="l">Table turns</div><div className="n">{t.tableTurns}</div><div className="delta down">▼ −0.2 vs target</div></div>
      </div>

      <div className="card">
        <div className="spread" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="row">
            <h2 style={{ fontSize: 16.5 }}>Tonight&rsquo;s book</h2>
            <span className="badge warn">Simulated · Bistrochat connector ready</span>
          </div>
          <div className="notice" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <b>{t.book.covers}</b> covers · <b>{t.book.parties}</b> parties · <b>{t.book.vip}</b> VIP · {t.book.noShowRisk} no-show risk
          </div>
        </div>
        <div>
          <div className="srcbar">
            {t.book.sources.map(([name, n]) => <i key={name} style={{ flex: n }} />)}
          </div>
          <div className="srckey">
            {t.book.sources.map(([name, n]) => <span key={name}>{name} {n}</span>)}
          </div>
        </div>
        <div>
          {t.book.rows.map((r, i) => (
            <div className="bookrow" key={i}>
              <span className="bt">{r.time}</span>
              <span className="bn">{r.name}</span>
              {r.vip && <span className="badge ok">★ VIP</span>}
              <span className="bsz">×{r.size}</span>
              <span className="badge">{r.src}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
