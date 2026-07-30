import Link from 'next/link';

// The insight feed — findings from lib/insights.js, severity-sorted. Kickers
// say where each number comes from ("Live from the store" vs "Simulated ops"),
// same honesty rule as everywhere else.
export default function InsightFeed({ insights, title }) {
  if (!insights?.length) return null;
  return (
    <div className="card">
      <div className="spread" style={{ flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 16.5 }}>{title}</h2>
        <span className="notice">computed each render — store facts + simulated ops</span>
      </div>
      <div className="ifeed">
        {insights.map((i) => (
          <div className={`irow ${i.severity}`} key={i.id}>
            <span className="idot" />
            <div className="ibody">
              <div className="eyebrow">{i.kl}</div>
              <div className="ih">{i.h}</div>
              <div className="ip">{i.p}</div>
              {i.impact && <div className="iimpact">{i.impact}</div>}
            </div>
            <Link className="btn" href={i.href}>{i.cta}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
