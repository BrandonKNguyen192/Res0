import { redirect } from 'next/navigation';
import { getSession } from '@/lib/contract.js';
import { canView, homeFor } from '@/lib/roles.js';
import { listSupplies, listOrders } from '@/lib/supplies.js';
import SuppliesOrder from './SuppliesOrder.jsx';

export default async function SuppliesPage({ searchParams }) {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  if (!canView(session.role, '/supplies')) redirect(homeFor(session.role));

  const flags = await searchParams;
  const catalog = listSupplies();
  const history = listOrders(session.orgId);

  const categories = [...new Set(catalog.map((s) => s.category))];

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">{session.orgName}</div>
          <h1>Supplies</h1>
          <p className="lede">
            Reorder supplies for your venues. Each reorder is a one-time payment — pay
            with card and it ships straight away.
          </p>
        </div>
      </div>

      {flags?.paid === 'success' && (
        <div className="notice" style={{ marginBottom: 18 }}>
          Payment confirmed. Your order has been placed.
        </div>
      )}
      {flags?.paid === 'cancelled' && (
        <div className="notice" style={{ marginBottom: 18 }}>
          Payment cancelled. Your order is still pending.
        </div>
      )}

      <SuppliesOrder catalog={catalog} categories={categories} history={history} />
    </>
  );
}
