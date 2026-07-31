// Demo supplies catalog + order tracking for the per-order paywall.
// In-memory only (like the in-memory fallback in lib/db.js) — no schema needed
// until real supplier connectors land.

const SUPPLIES = [
  { id: 's1', category: 'Spirits',     name: 'Grey Goose Vodka',     unit: '1L bottle',  unitPrice: 38,  icon: '🥃' },
  { id: 's2', category: 'Spirits',     name: 'Don Julio Blanco',    unit: '1L bottle',  unitPrice: 45,  icon: '🥃' },
  { id: 's3', category: 'Wine',        name: 'Sancerre, Domaine Vacheron',  unit: '750ml bottle', unitPrice: 22, icon: '🍷' },
  { id: 's4', category: 'Wine',        name: 'Barolo, Gaja',         unit: '750ml bottle', unitPrice: 64,  icon: '🍷' },
  { id: 's5', category: 'Beer',        name: 'Singha Lager',         unit: 'Case of 24', unitPrice: 36,  icon: '🍺' },
  { id: 's6', category: 'Produce',     name: 'Avocado (Hass)',       unit: 'Case of 48', unitPrice: 52,  icon: '🥑' },
  { id: 's7', category: 'Produce',     name: 'Baby Gem Lettuce',     unit: 'Case of 12', unitPrice: 28,  icon: '🥬' },
  { id: 's8', category: 'Protein',     name: 'Wagyu Striploin (A5)', unit: 'kg',          unitPrice: 180, icon: '🥩' },
  { id: 's9', category: 'Protein',     name: 'Atlantic Salmon',      unit: 'kg',          unitPrice: 32,  icon: '🐟' },
  { id: 's10', category: 'Dry Goods',  name: 'Carnaroli Rice',       unit: '10kg bag',    unitPrice: 35,  icon: '🍚' },
  { id: 's11', category: 'Dry Goods',  name: 'EVOO, Oleificio Zuccardi', unit: '3L tin', unitPrice: 48,  icon: '🫒' },
  { id: 's12', category: 'Cleaning',   name: 'Sanitiser (5L)',       unit: '5L',          unitPrice: 18,  icon: '🧴' },
];

export function listSupplies() {
  return SUPPLIES;
}

export function getSupply(id) {
  return SUPPLIES.find((s) => s.id === id) || null;
}

// ── orders (in-memory, scoped by orgId) ──────────────────────────────────────
const orders = new Map();
let seq = 0;

const now = () => new Date().toISOString();

export function createOrder(orgId, items) {
  // items: [{ id: 's1', quantity: 2 }, ...]
  const orderItems = items.map(({ id, quantity }) => {
    const supply = getSupply(id);
    if (!supply) throw new Error(`Unknown supply: ${id}`);
    return { supplyId: id, name: supply.name, unit: supply.unit, unitPrice: supply.unitPrice, quantity };
  });

  const total = orderItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const order = {
    id: `ord_${++seq}`,
    orgId,
    items: orderItems,
    total,
    status: 'pending',
    stripeSessionId: null,
    createdAt: now(),
  };

  if (!orders.has(orgId)) orders.set(orgId, []);
  orders.get(orgId).push(order);
  return order;
}

export function getOrder(orgId, orderId) {
  const list = orders.get(orgId) || [];
  return list.find((o) => o.id === orderId) || null;
}

export function listOrders(orgId) {
  return orders.get(orgId) || [];
}

export function markOrderPaid(orgId, orderId, stripeSessionId) {
  const order = getOrder(orgId, orderId);
  if (!order) return null;
  order.status = 'paid';
  order.stripeSessionId = stripeSessionId;
  return order;
}
