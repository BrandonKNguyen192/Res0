// Entitlement is an identity fact: subscription state feeds back into what
// members can do. This is the single place that answers "is this org live?".

export type OrgBilling = {
  subscription_status: string;
  licensed_venues: number;
};

const LIVE_STATUSES = new Set(["active", "trialing"]);

export function isEntitled(org: OrgBilling): boolean {
  return LIVE_STATUSES.has(org.subscription_status);
}

// Publishing a venue's guest menu is gated on the subscription being live and
// the venue being within the licensed quantity. Quantity tracks active venues
// automatically, so the second clause only bites when a payment lapses between
// adding a venue and the webhook landing.
export function canPublish(org: OrgBilling, activeVenueCount: number): boolean {
  return isEntitled(org) && activeVenueCount <= org.licensed_venues;
}

export function entitlementLabel(org: OrgBilling): string {
  if (isEntitled(org)) return org.subscription_status;
  if (org.subscription_status === "none") return "no subscription";
  return org.subscription_status;
}
