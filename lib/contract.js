// THE SEAM. This is the only file more than one person touches.
//
// The core app (venues, members, menus, the paywall) is built entirely against these three
// functions. Both stub bodies have now been REPLACED with the real implementations — each
// falls back to its stub only while its service is unprovisioned, so the app still runs
// credential-less. Nothing that consumes this file changed.
//
//   A (Identity) → getSession()      real Auth0 session when AUTH0_* is set, stub otherwise
//   B (Billing)  → getEntitlement()  webhook-persisted row when the store has one, stub otherwise
//   C (Core)     → canAddVenue()     owns this, and everything that calls it
//
// Keep the shapes. If a shape has to change, say so out loud — three files consume it.

import { auth0 } from '@/lib/auth0.js';
import { getEntitlementRow, usingNeon } from '@/lib/db.js';

export const DEMO_ORG = 'org_soho';

/**
 * Who is asking, and which group are they in.
 *
 * Real branch: the Auth0 session. `org_id` comes from the token (Auth0 Organizations), never
 * from a query param. Returns null when signed out — pages redirect to /auth/login.
 *
 * A — remaining for you: enforce organization-scoped login (org picker or
 * /auth/login?organization=org_x) and put real roles on the token via an Action writing the
 * `https://res0.app/roles` claim; until then members default to ['owner'].
 *
 * @returns {Promise<{userId:string,email:string,name:string,orgId:string,orgName:string,roles:string[]}|null>}
 */
export async function getSession() {
  if (auth0) {
    const s = await auth0.getSession();
    if (!s?.user) return null;
    const u = s.user;
    const orgId = typeof u.org_id === 'string' && u.org_id ? u.org_id : null;
    if (!orgId) return null; // no Organization on the token → treat as signed out
    const claimed = u['https://res0.app/roles'];
    const roles = Array.isArray(claimed) && claimed.length ? claimed : ['owner'];
    return {
      userId: u.sub,
      email: u.email || '',
      name: u.name || u.email || 'Member',
      orgId,
      orgName: typeof u.org_name === 'string' && u.org_name ? u.org_name : 'Your group',
      roles,
    };
  }
  // Stub — until `stripe projects add auth0/client` lands.
  return {
    userId: 'u_demo',
    email: 'brandon@sohohospitality.co',
    name: 'Brandon Nguyen',
    orgId: DEMO_ORG,
    orgName: 'Soho Hospitality',
    roles: ['owner'],
  };
}

/**
 * What that group has paid for.
 *
 * Real branch: the webhook-persisted entitlements row (lib/db.js) — never a live Stripe call
 * on a page render. The webhook (app/api/stripe/webhook) is the only writer.
 *
 * With Neon and no row yet: status 'none' — a real org starts unsubscribed, which is the
 * demo's opening state. Without Neon and no row: the original stub (active, quantity 2, so
 * the paywall fires on the third seeded venue from the first minute).
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
  return { status: 'active', quantity: 2, periodEnd: null, customerId: null };
}

/**
 * The entitlement rule. Owned by C; called by the venues page and the publish action.
 *
 * This is the join: an identity fact (which org) and a billing fact (what it pays for) decide
 * one thing together. Neither Auth0 nor Stripe can answer it alone, which is the whole premise.
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
