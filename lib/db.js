// The store — in memory with no connection string, Neon Postgres with one.
//
// Deliberately narrow: the same row-level operations either way, every one scoped by orgId.
// That scoping is not a convenience, it is the product's boundary — a query that forgets it
// would let one hospitality group read another's venues, which is the exact failure the
// premise claims to design out.
//
// Neon writes `NEON_POSTGRES_CONNECTION_STRING` (NOT `DATABASE_URL`). Run `npm run db:migrate`
// once after provisioning; the schema lives in db/schema.sql. Callers only ever see these
// functions — the swap is invisible above this file.
//
// In-memory mode: module-scope Map, state resets on server restart in dev. Fine for a
// credential-less boot, and exactly what Neon replaces.

import pg from 'pg';

const connectionString = process.env.NEON_POSTGRES_CONNECTION_STRING;
export const usingNeon = Boolean(connectionString);

function getPool() {
  if (!globalThis.__res0Pool) {
    globalThis.__res0Pool = new pg.Pool({
      connectionString,
      max: 5,
      ssl: /localhost|127\.0\.0\.1/.test(connectionString)
        ? undefined
        : { rejectUnauthorized: true },
    });
  }
  return globalThis.__res0Pool;
}

const q = async (text, params = []) => (await getPool().query(text, params)).rows;

const iso = (v) => (v instanceof Date ? v.toISOString() : v);
const toVenue = (r) =>
  r
    ? {
        id: r.id, kind: 'venue', orgId: r.org_id, name: r.name, city: r.city,
        slug: r.slug, published: r.published, menu: r.menu, createdAt: iso(r.created_at),
      }
    : null;
const toMember = (r) =>
  r
    ? {
        id: r.id, kind: 'member', orgId: r.org_id, name: r.name, email: r.email,
        role: r.role, venueId: r.venue_id, createdAt: iso(r.created_at),
      }
    : null;

// ── in-memory fallback ───────────────────────────────────────────────────────
const rows = new Map();
const entitlements = new Map(); // orgId → row; lets the Stripe loop run before Neon lands
let seq = 0;
const id = (kind) => `${kind}_${++seq}`;
const now = () => new Date().toISOString();

function insert(kind, orgId, fields) {
  const row = { id: id(kind), kind, orgId, createdAt: now(), ...fields };
  rows.set(row.id, row);
  return row;
}

// ── venues ───────────────────────────────────────────────────────────────────
export async function listVenues(orgId) {
  if (usingNeon) {
    return (
      await q(`select * from venues where org_id = $1 order by created_at asc`, [orgId])
    ).map(toVenue);
  }
  return [...rows.values()]
    .filter((r) => r.kind === 'venue' && r.orgId === orgId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getVenue(orgId, venueId) {
  if (usingNeon) {
    // Cross-org reads return not-found rather than a 403 — never confirm another group's ids exist.
    const found = await q(`select * from venues where id = $1 and org_id = $2`, [venueId, orgId]);
    return toVenue(found[0]);
  }
  const v = rows.get(venueId);
  return v && v.kind === 'venue' && v.orgId === orgId ? v : null;
}

export async function getVenueBySlug(slug) {
  if (usingNeon) {
    const found = await q(`select * from venues where slug = $1`, [slug]);
    return toVenue(found[0]);
  }
  return [...rows.values()].find((r) => r.kind === 'venue' && r.slug === slug) || null;
}

const slugFor = (name, slug) =>
  slug || String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function createVenue(orgId, { name, city, slug }) {
  if (usingNeon) {
    const created = await q(
      `insert into venues (org_id, name, city, slug) values ($1, $2, $3, $4) returning *`,
      [orgId, name, city || '', slugFor(name, slug)],
    );
    return toVenue(created[0]);
  }
  return insert('venue', orgId, {
    name, city: city || '', slug: slugFor(name, slug), published: false, menu: null,
  });
}

export async function updateVenue(orgId, venueId, patch) {
  if (usingNeon) {
    const sets = [];
    const params = [venueId, orgId];
    for (const key of ['name', 'city', 'slug', 'published']) {
      if (key in patch) {
        params.push(patch[key]);
        sets.push(`${key} = $${params.length}`);
      }
    }
    if ('menu' in patch) {
      params.push(patch.menu == null ? null : JSON.stringify(patch.menu));
      sets.push(`menu = $${params.length}::jsonb`);
    }
    if (!sets.length) return getVenue(orgId, venueId);
    const updated = await q(
      `update venues set ${sets.join(', ')}, updated_at = now()
       where id = $1 and org_id = $2 returning *`,
      params,
    );
    return toVenue(updated[0]);
  }
  const v = await getVenue(orgId, venueId);
  if (!v) return null;
  Object.assign(v, patch, { updatedAt: now() });
  return v;
}

// ── members ──────────────────────────────────────────────────────────────────
// Read-only here today. A owns invitations; when Auth0 Organizations land, this reads from
// the org's member list rather than from local rows.
export async function listMembers(orgId) {
  if (usingNeon) {
    return (
      await q(`select * from members where org_id = $1 order by created_at asc`, [orgId])
    ).map(toMember);
  }
  return [...rows.values()].filter((r) => r.kind === 'member' && r.orgId === orgId);
}

export async function createMember(orgId, { name, email, role, venueId = null }) {
  if (usingNeon) {
    const created = await q(
      `insert into members (org_id, name, email, role, venue_id)
       values ($1, $2, $3, $4, $5) returning *`,
      [orgId, name, email, role, venueId],
    );
    return toMember(created[0]);
  }
  return insert('member', orgId, { name, email, role, venueId });
}

// ── entitlements ─────────────────────────────────────────────────────────────
// Written by the Stripe webhook (the source of truth), read by contract.getEntitlement().
// Keyed by orgId — the subscription belongs to the organisation, never to a user.
export async function getEntitlementRow(orgId) {
  if (usingNeon) {
    const found = await q(`select * from entitlements where org_id = $1`, [orgId]);
    const r = found[0];
    return r
      ? {
          status: r.status, quantity: r.quantity, periodEnd: r.period_end,
          customerId: r.customer_id, subscriptionId: r.subscription_id,
        }
      : null;
  }
  return entitlements.get(orgId) || null;
}

export async function saveEntitlementRow(
  orgId,
  { status, quantity, periodEnd = null, customerId = null, subscriptionId = null },
) {
  if (usingNeon) {
    await q(
      `insert into entitlements (org_id, status, quantity, period_end, customer_id, subscription_id, updated_at)
       values ($1, $2, $3, $4, $5, $6, now())
       on conflict (org_id) do update set
         status = excluded.status, quantity = excluded.quantity, period_end = excluded.period_end,
         customer_id = excluded.customer_id, subscription_id = excluded.subscription_id,
         updated_at = now()`,
      [orgId, status, quantity, periodEnd, customerId, subscriptionId],
    );
    return;
  }
  entitlements.set(orgId, { status, quantity, periodEnd, customerId, subscriptionId });
}

// ── seed ─────────────────────────────────────────────────────────────────────
// Two venues on purpose: the plan covers two, so the third is blocked. The demo opens on a
// workspace that looks lived-in rather than on an empty state. In Neon mode this runs once
// per org (guarded by an existence check) so the real org is lived-in too.
let seeded = false;
const seededOrgs = new Set();

export async function seed(orgId) {
  if (usingNeon) {
    if (seededOrgs.has(orgId)) return;
    const existing = await q(`select 1 from venues where org_id = $1 limit 1`, [orgId]);
    seededOrgs.add(orgId);
    if (existing.length) return;
  } else {
    if (seeded) return;
    seeded = true;
  }

  const above = await createVenue(orgId, { name: 'Above Eleven', city: 'Bangkok', slug: 'above-eleven' });
  await updateVenue(orgId, above.id, {
    published: true,
    menu: {
      title: 'Above Eleven',
      subtitle: 'Rooftop · Peruvian-Japanese · 33rd floor',
      sections: [
        {
          name: 'To begin',
          items: [
            { name: 'Tiradito Nikkei', desc: 'Sea bass, yuzu leche de tigre, aji amarillo', price: '¥520' },
            { name: 'Causa Limeña', desc: 'Whipped potato, king crab, rocoto', price: '¥480' },
          ],
        },
        {
          name: 'From the robata',
          items: [
            { name: 'Wagyu Anticucho', desc: 'A5 skewer, panca glaze, burnt lime', price: '¥1,280' },
            { name: 'Black Cod Den Miso', desc: 'Forty-eight hours in miso, hoba leaf', price: '¥1,150' },
          ],
        },
      ],
    },
  });

  await createVenue(orgId, { name: 'Charcoal Bangkok', city: 'Bangkok', slug: 'charcoal-bkk' });

  await createMember(orgId, { name: 'Brandon Nguyen', email: 'brandon@sohohospitality.co', role: 'owner' });
  await createMember(orgId, { name: 'Maria Santos', email: 'maria@sohohospitality.co', role: 'manager', venueId: above.id });
  await createMember(orgId, { name: 'David Chen', email: 'david@sohohospitality.co', role: 'staff', venueId: above.id });
}
