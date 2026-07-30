import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/contract.js';
import { homeFor } from '@/lib/roles.js';

// Owner-only platform sections that exist on the roadmap, not in the 4-hour
// build. A named empty state beats a dead link or a fake screen.
const SECTIONS = {
  inventory: ['Inventory', 'Counts, pars and auto-86 thresholds, fed by the invoice connector.'],
  'marketing-studio': ['Marketing studio', 'Campaigns and guest comms, scoped per venue.'],
  guests: ['Guests', 'One guest graph across every venue — visits, spend, allergies, VIP flags.'],
  analytics: ['Analytics', 'Prime cost, mix and pace across the portfolio.'],
  connections: ['Connections', 'POS, reservations, labor and invoice connectors: the /api/connectors rail.'],
};

export default async function SectionPage({ params }) {
  const { section } = await params;
  const meta = SECTIONS[section];
  if (!meta) notFound();

  const session = await getSession();
  if (!session) redirect('/auth/login');
  if (session.role !== 'owner') redirect(homeFor(session.role));

  const [title, blurb] = meta;
  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">{session.orgName}</div>
          <h1>{title}</h1>
          <p className="lede">{blurb}</p>
        </div>
      </div>
      <div className="blocked" style={{ cursor: 'default' }}>
        <div style={{ fontWeight: 400, color: 'var(--color-ink)' }}>On the platform roadmap</div>
        <div className="notice">
          This section ships after the pilot — today&rsquo;s build is the boundary: identity,
          billing, venues and menus.
        </div>
      </div>
    </>
  );
}
