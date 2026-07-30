// THE SEAM. This is the only file more than one person touches.
//
// The core app is built entirely against these functions. Both stub bodies have
// been REPLACED with real implementations — each falls back to its stub only
// while its service is unprovisioned, so the app still runs credential-less.
//
//   A (Identity) → getSession()      real Auth0 session when AUTH0_* is set, personas otherwise
//   B (Billing)  → getEntitlement()  webhook-persisted row when the store has one, stub otherwise
//   C (Core)     → canAddVenue()     owns this, and everything that calls it
//
// ROLES are identity facts. Live mode: the `https://res0.app/roles` claim (an
// Auth0 Action writes it) plus `https://res0.app/venue` for venue-scoped roles.
// Stub mode: four personas, switched by the demo-only "View as" control, which
// sets a cookie server-side — same session shape, same enforcement code paths,
// so swapping in Auth0 changes where the role COMES FROM and nothing else.

import { cookies } from 'next/headers';
import { auth0 } from '@/lib/auth0.js';
import { getEntitlementRow, usingNeon } from '@/lib/db.js';
import { ROLES, ROLE_LABEL } from '@/lib/roles.js';

export const DEMO_ORG = 'org_soho';

const PERSONAS = {
  owner: {
    userId: 'u_owner', email: 'brandon@sohohospitality.co', name: 'Brandon Nguyen',
    role: 'owner', venueSlug: null,
  },
  general_manager: {
    userId: 'u_gm', email: 'maria@sohohospitality.co', name: 'Maria Santos',
    role: 'general_manager', venueSlug: 'above-eleven',
  },
  beverage_director: {
    userId: 'u_bev', email: 'priya@sohohospitality.co', name: 'Priya Anand',
    role: 'beverage_director', venueSlug: null,
  },
  server: {
    userId: 'u_srv', email: 'david@sohohospitality.co', name: 'David Chen',
    role: 'server', venueSlug: 'above-eleven',
  },
};

/**
 * Who is asking, which group they're in, and what their role lets them see.
 *
 * @returns {Promise<{userId:string,email:string,name:string,orgId:string,orgName:string,
 *   roles:string[],role:string,roleLabel:string,venueSlug:string|null,demo:boolean}|null>}
 */
export async function getSession() {
  if (auth0) {
    const s = await auth0.getSession();
    if (!s?.user) return null;
    const u = s.user;
    const orgId = typeof u.org_id === 'string' && u.org_id ? u.org_id : null;
    if (!orgId) return null; // no Organization on the token → treat as signed out
    const claimed = Array.isArray(u['https://res0.app/roles']) ? u['https://res0.app/roles'] : [];
    const role = ROLES.find((r) => claimed.includes(r)) ?? 'owner';
    const venueSlug = typeof u['https://res0.app/venue'] === 'string' ? u['https://res0.app/venue'] : null;
    return {
      userId: u.sub,
      email: u.email || '',
      name: u.name || u.email || 'Member',
      orgId,
      orgName: typeof u.org_name === 'string' && u.org_name ? u.org_name : 'Your group',
      roles: claimed.length ? claimed : [role],
      role,
      roleLabel: ROLE_LABEL[role],
      venueSlug,
      demo: false,
    };
  }

  // Stub — until `stripe projects add auth0/client` lands. The persona cookie
  // is set by the "View as" control (a server action), so even the demo's role
  // switch round-trips through the server like a real login would.
  const jar = await cookies();
  const picked = jar.get('res0_demo_role')?.value;
  const persona = PERSONAS[picked] ?? PERSONAS.owner;
  return {
    ...persona,
    orgId: DEMO_ORG,
    orgName: 'Soho Hospitality',
    roles: [persona.role],
    roleLabel: ROLE_LABEL[persona.role],
    demo: true,
  };
}

/**
 * What that group has paid for. Real branch: the webhook-persisted entitlements
 * row (lib/db.js) — never a live Stripe call on a page render. The webhook
 * (app/api/stripe/webhook) is the only writer.
 *
 * @returns {Promise<{status:'active'|'past_due'|'none',quantity:number,periodEnd:string|null,customerId:string|null}>}
 */
export async function getEntitlement(orgId) {
  const row = await getEntitlementRow(orgId);
  if (row) {
    return { status: row.status, quantity: row.quantity, periodEnd: row.periodEnd, customerId: row.customerId };
  }
  if (usingNeon) {
    return { status: 'none', quantity: 0, periodEnd: null, customerId: null };
  }
  // Stub: quantity 2 on purpose — the seed creates 2 venues, so the paywall
  // fires on the third from the first minute.
  return { status: 'active', quantity: 2, periodEnd: null, customerId: null };
}

/**
 * The entitlement rule. Owned by C; called by the venues page and the publish
 * action. The join: an identity fact and a billing fact decide one thing
 * together — neither Auth0 nor Stripe can answer it alone.
 */
export function canAddVenue(entitlement, currentCount) {
  if (!entitlement || entitlement.status !== 'active') {
    return { ok: false, reason: 'no-subscription', message: 'This group has no active subscription.' };
  }
  if (currentCount >= entitlement.quantity) {
    return {
      ok: false,
      reason: 'at-limit',
      message: `Your plan covers ${entitlement.quantity} venue${entitlement.quantity === 1 ? '' : 's'}. This would be number ${currentCount + 1}.`,
    };
  }
  return { ok: true };
}

/** Publishing a guest menu is gated on the same fact. */
export function canPublish(entitlement) {
  return entitlement?.status === 'active';
}
