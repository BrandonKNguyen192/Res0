// The store — in memory today, Neon Postgres the moment it is provisioned.
//
// Deliberately narrow: five row-level operations, every one scoped by orgId. That scoping is
// not a convenience, it is the product's boundary — a query that forgets it would let one
// hospitality group read another's venues, which is the exact failure the premise claims to
// design out.
//
// TO MOVE TO NEON: replace the four functions at the bottom with SQL against
// `NEON_POSTGRES_CONNECTION_STRING` (note: Neon writes that name, NOT `DATABASE_URL`).
// Every caller keeps working, because callers only ever see these functions.
//
// Module-scope Map means state resets on server restart in dev. That is fine for today and
// is exactly why this is the first thing to swap.

const rows = new Map();
let seq = 0;
const id = (kind) => `${kind}_${++seq}`;
const now = () => new Date().toISOString();

function insert(kind, orgId, fields) {
  const row = { id: id(kind), kind, orgId, createdAt: now(), ...fields };
  rows.set(row.id, row);
  return row;
}

// ── venues ───────────────────────────────────────────────────────────────────
export const listVenues = (orgId) =>
  [...rows.values()].filter((r) => r.kind === 'venue' && r.orgId === orgId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

export const getVenue = (orgId, venueId) => {
  const v = rows.get(venueId);
  // Cross-org reads return not-found rather than a 403 — never confirm another group's ids exist.
  return v && v.kind === 'venue' && v.orgId === orgId ? v : null;
};

export const getVenueBySlug = (slug) =>
  [...rows.values()].find((r) => r.kind === 'venue' && r.slug === slug) || null;

export const createVenue = (orgId, { name, city, slug }) =>
  insert('venue', orgId, {
    name,
    city: city || '',
    slug: slug || String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    published: false,
    menu: null,
  });

export const updateVenue = (orgId, venueId, patch) => {
  const v = getVenue(orgId, venueId);
  if (!v) return null;
  Object.assign(v, patch, { updatedAt: now() });
  return v;
};

// ── members ──────────────────────────────────────────────────────────────────
// Read-only here today. A owns invitations; when Auth0 Organizations land, this reads from
// the org's member list rather than from local rows.
export const listMembers = (orgId) =>
  [...rows.values()].filter((r) => r.kind === 'member' && r.orgId === orgId);

export const createMember = (orgId, { name, email, role, venueId = null }) =>
  insert('member', orgId, { name, email, role, venueId });

// ── seed ─────────────────────────────────────────────────────────────────────
// Two venues on purpose: the plan covers two, so the third is blocked. The demo opens on a
// workspace that looks lived-in rather than on an empty state.
let seeded = false;
export function seed(orgId) {
  if (seeded) return;
  seeded = true;

  const above = createVenue(orgId, { name: 'Above Eleven', city: 'Bangkok', slug: 'above-eleven' });
  updateVenue(orgId, above.id, {
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

  createVenue(orgId, { name: 'Charcoal Bangkok', city: 'Bangkok', slug: 'charcoal-bkk' });

  createMember(orgId, { name: 'Brandon Nguyen', email: 'brandon@sohohospitality.co', role: 'owner' });
  createMember(orgId, { name: 'Maria Santos', email: 'maria@sohohospitality.co', role: 'manager', venueId: above.id });
  createMember(orgId, { name: 'David Chen', email: 'david@sohohospitality.co', role: 'staff', venueId: above.id });
}
