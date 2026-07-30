-- Res0 schema — mirrors the shapes lib/db.js serves from memory.
-- Idempotent; applied by `npm run db:migrate`.

create table if not exists venues (
  id text primary key default gen_random_uuid()::text,
  org_id text not null,
  name text not null,
  city text not null default '',
  slug text unique not null,
  published boolean not null default false,
  menu jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists venues_org_idx on venues(org_id);

create table if not exists members (
  id text primary key default gen_random_uuid()::text,
  org_id text not null,
  name text not null,
  email text not null,
  role text not null,
  venue_id text references venues(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists members_org_idx on members(org_id);

-- Written only by the Stripe webhook; read by contract.getEntitlement().
-- Keyed by the Auth0 Organization id — the group owns the subscription.
create table if not exists entitlements (
  org_id text primary key,
  status text not null default 'none',
  quantity integer not null default 0,
  period_end text,
  customer_id text,
  subscription_id text,
  updated_at timestamptz not null default now()
);
