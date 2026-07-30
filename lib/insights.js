// The insight engine — "hidden gems & inefficiencies", computed FROM data
// instead of hardcoded. The pattern comes from the unification platform's
// insight engine; the rules here are written for Res0's shape: each is a pure
// function (ctx) => Insight | null, reading defensively so missing data means
// no card, never a crash.
//
// Two independent axes, deliberately not conflated:
//   • k        ('gem' | 'leak' | 'risk') — what KIND of finding it is
//   • severity ('red' | 'yellow' | 'green') — the sort + attention axis
//
// REAL rules read the store (publish state, entitlement); SIMULATED rules read
// the demo ops feed and say so in their kicker. `roles` targets the card — the
// same engine feeds the owner's portfolio feed and each role's pre-shift brief.

const SEV_RANK = { red: 0, yellow: 1, green: 2 };
const usd = (v) => `$${Math.round(v).toLocaleString('en-US')}`;

// ── rules ────────────────────────────────────────────────────────────────────

// REAL — an active venue with no published guest menu is invisible to guests.
function unpublishedVenue(ctx) {
  const draft = (ctx.venues || []).filter((v) => v.active !== false && !v.published);
  if (!draft.length) return null;
  const first = draft[0];
  return {
    id: 'unpublished-venue', k: 'leak', kl: 'Live from the store',
    h: `${first.name} isn’t on the guest surface`,
    p: draft.length === 1
      ? 'The venue is active but its menu is unpublished — guests can’t see it. Publishing takes one tap once the menu is built.'
      : `${draft.length} active venues have unpublished menus — guests can’t see them.`,
    severity: 'yellow',
    roles: ['owner', 'general_manager'],
    cta: 'Open the venue', href: `/venues/${first.id}`,
  };
}

// REAL — entitlement is an identity fact; when it lapses, everything gates.
function subscriptionLapsed(ctx) {
  if (!ctx.entitlement || ctx.entitlement.status === 'active') return null;
  return {
    id: 'subscription-lapsed', k: 'risk', kl: 'Live from the store',
    h: 'No live subscription — publishing is locked',
    p: 'Guest menus stay private until the subscription is active. The webhook flips this the moment Stripe confirms payment.',
    severity: 'red',
    roles: ['owner'],
    cta: 'Open billing', href: '/billing',
  };
}

// REAL — at the plan limit: the next venue is a quantity change, price it now.
function planAtLimit(ctx) {
  const e = ctx.entitlement;
  const count = (ctx.venues || []).length;
  if (!e || e.status !== 'active' || count < e.quantity) return null;
  return {
    id: 'plan-at-limit', k: 'gem', kl: 'Live from the store',
    h: `The plan is fully used — ${count} of ${e.quantity} venues`,
    p: 'Opening the next venue is a subscription quantity change with proration, not a renegotiation. That’s the point.',
    severity: 'green',
    roles: ['owner'],
    cta: 'See the plan', href: '/billing',
  };
}

// SIMULATED — the venue whose labor runs furthest above the best-run venue.
function laborAboveFloor(ctx) {
  const rows = ctx.ops || [];
  if (rows.length < 2) return null;
  const floor = Math.min(...rows.map((r) => r.o.laborPct));
  const worst = rows.reduce((a, b) => (b.o.laborPct > a.o.laborPct ? b : a));
  const gap = worst.o.laborPct - floor;
  if (gap < 2) return null;
  const recoverable = (gap / 100) * worst.o.revenue * 30;
  return {
    id: 'labor-above-floor', k: 'leak', kl: 'Simulated ops',
    h: `${worst.venue.name} runs labor ${gap} pts above your best venue`,
    p: `${worst.o.laborPct}% against a ${floor}% floor elsewhere in the group. The gap is schedule shape, not headcount.`,
    impact: `≈ ${usd(recoverable)} / mo recoverable`,
    severity: gap >= 4 ? 'red' : 'yellow',
    roles: ['owner', 'general_manager'],
    cta: 'Open live ops', href: '/live-ops',
  };
}

// SIMULATED — turns below target with full books = seating shape, not demand.
function tableTurnsBelowTarget(ctx) {
  const t = ctx.tonight;
  if (!t) return null;
  const turns = parseFloat(t.tableTurns);
  if (!(turns < 2.0)) return null;
  return {
    id: 'table-turns', k: 'leak', kl: 'Simulated ops',
    h: `Turns at ${t.tableTurns} against a 2.0 target — with a full book`,
    p: 'Covers are there; the dining room is the bottleneck. Tightening the 18:00 seating recovers most of it.',
    impact: `≈ ${usd(t.avgCheck * 6 * 30)} / mo on the table`,
    severity: 'yellow',
    roles: ['owner', 'general_manager'],
    cta: 'Tonight’s book', href: '/today',
  };
}

// SIMULATED — the pour that's carrying the night deserves the window.
function topPourGem(ctx) {
  const t = ctx.tonight;
  if (!t?.topPour) return null;
  return {
    id: 'top-pour', k: 'gem', kl: 'Simulated ops',
    h: `${t.topPour} is carrying the bar — ${t.topPourNote}`,
    p: 'Feature it at the by-the-glass window and brief the floor; momentum like this is worth a push while it lasts.',
    severity: 'green',
    roles: ['owner', 'beverage_director', 'server'],
    cta: 'Beverage program', href: '/beverage',
  };
}

// SIMULATED — repeat-guest share climbing is the cheapest growth there is.
function repeatGuests(ctx) {
  const t = ctx.tonight;
  if (!t || t.repeatGuests < 30) return null;
  return {
    id: 'repeat-guests', k: 'gem', kl: 'Simulated ops',
    h: `${t.repeatGuests}% of tonight’s covers are repeat guests`,
    p: 'Up 2 pts on Q1. A named welcome-back at the door costs nothing and compounds.',
    severity: 'green',
    roles: ['owner', 'server'],
    cta: 'Tonight’s book', href: '/today',
  };
}

const RULES = [
  subscriptionLapsed,
  unpublishedVenue,
  planAtLimit,
  laborAboveFloor,
  tableTurnsBelowTarget,
  topPourGem,
  repeatGuests,
];

/** @returns sorted insights for a role ('*' for all). */
export function computeInsights(ctx, role = '*') {
  return RULES
    .map((rule) => rule(ctx))
    .filter(Boolean)
    .filter((i) => role === '*' || i.roles.includes(role))
    .sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]);
}
