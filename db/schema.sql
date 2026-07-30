-- Res0 schema. The group is the account (Auth0 Organization), the venue is the
-- billable unit, entitlement is a column the Stripe webhook keeps honest.

create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  auth0_org_id text unique not null,
  name text not null,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  subscription_status text not null default 'none',
  licensed_venues integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  slug text unique not null,
  active boolean not null default true,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists venues_org_idx on venues(org_id);

create table if not exists menu_sections (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  position integer not null default 0
);

create index if not exists menu_sections_venue_idx on menu_sections(venue_id);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references menu_sections(id) on delete cascade,
  name text not null,
  description text,
  price_cents integer,
  position integer not null default 0
);

create index if not exists menu_items_section_idx on menu_items(section_id);
