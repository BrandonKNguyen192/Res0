// Role-based views. The role is an IDENTITY fact: it rides the Auth0 token
// (`https://res0.app/roles` claim, mapped in lib/contract.js), never a query
// param or a client-side choice. Pages enforce server-side with requireView();
// the sidebar merely reflects what the token already decided.
//
// Personas:
//   owner             — the portfolio view: every venue, every number, billing
//   general_manager   — one venue's operations: today, floor, their team
//   beverage_director — the program across venues: pours, by-the-glass, 86s
//   server            — tonight, at their venue: the book and the 86 board

export const ROLES = ['owner', 'general_manager', 'beverage_director', 'server'];

export const ROLE_LABEL = {
  owner: 'Owner',
  general_manager: 'General manager',
  beverage_director: 'Beverage director',
  server: 'Server',
};

// nav item → which roles see it. Order = sidebar order.
export const NAV = [
  { href: '/portfolio', label: 'Portfolio', roles: ['owner'] },
  { href: '/today', label: 'Today', roles: ['owner', 'general_manager', 'server'] },
  { href: '/live-ops', label: 'Live ops', roles: ['owner', 'general_manager', 'server', 'beverage_director'] },
  { href: '/dashboard', label: 'Venue hub', roles: ['owner', 'general_manager'] },
  { href: '/beverage', label: 'Beverage program', roles: ['owner', 'beverage_director'] },
  { href: '/members', label: 'Team', roles: ['owner', 'general_manager'] },
  { href: '/billing', label: 'Billing', roles: ['owner'] },
  { href: '/s/inventory', label: 'Inventory', roles: ['owner'] },
  { href: '/s/marketing-studio', label: 'Marketing studio', roles: ['owner'] },
  { href: '/s/guests', label: 'Guests', roles: ['owner'] },
  { href: '/s/analytics', label: 'Analytics', roles: ['owner'] },
  { href: '/s/connections', label: 'Connections', roles: ['owner'] },
];

export const HOME = {
  owner: '/portfolio',
  general_manager: '/today',
  beverage_director: '/beverage',
  server: '/today',
};

export function navFor(role) {
  return NAV.filter((item) => item.roles.includes(role));
}

export function canView(role, href) {
  const item = NAV.find((n) => n.href === href);
  return item ? item.roles.includes(role) : role === 'owner';
}

export function homeFor(role) {
  return HOME[role] ?? '/today';
}

/** Scope a venue list to the session: owner + beverage see all, venue-scoped
 *  roles (GM, server) see their own venue only. */
export function scopeVenues(session, venues) {
  if (!session.venueSlug) return venues;
  return venues.filter((v) => v.slug === session.venueSlug);
}
