// THE SEAM. This is the only file more than one person touches.
//
// The core app (venues, members, menus, the paywall) is built entirely against these three
// functions, so it runs today on stubs — before Auth0 is provisioned and before Stripe has a
// product. When those land, each owner replaces ONLY their own function body. Nothing that
// consumes this file has to change.
//
//   A (Identity) → getSession()      replace the stub, keep the return shape
//   B (Billing)  → getEntitlement()  replace the stub, keep the return shape
//   C (Core)     → canAddVenue()     owns this, and everything that calls it
//
// Keep the shapes. If a shape has to change, say so out loud — three files consume it.

export const DEMO_ORG = 'org_soho';

/**
 * Who is asking, and which group are they in.
 *
 * A — REPLACE THE BODY with the Auth0 session. Read `org_id` from the token (Auth0
 * Organizations), not from a query param, and map Auth0 roles onto `roles`.
 *
 * @returns {Promise<{userId:string,email:string,name:string,orgId:string,orgName:string,roles:string[]}|null>}
 */
export async function getSession() {
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
 * B — REPLACE THE BODY with the subscription read. `quantity` is the number of venues the
 * plan covers. Drive it from the webhook-persisted row, not from a live Stripe call on every
 * page render.
 *
 * NOTE: the stub returns quantity 2 on purpose. The seed creates 2 venues, so the paywall
 * fires on the third from the first minute — the demo's money moment is exercised all
 * afternoon instead of being discovered at 16:00.
 *
 * @returns {Promise<{status:'active'|'past_due'|'none',quantity:number,periodEnd:string|null,customerId:string|null}>}
 */
export async function getEntitlement(orgId) {
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
