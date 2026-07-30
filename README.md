# Res0

**Multi-venue hospitality SaaS where identity and billing share one boundary.**

Built at *Built Different: Auth0 × Stripe* — San Francisco, 30 July 2026.

---

## The premise

Identity and billing are the same question asked twice — *who is the customer?* — and almost
every SaaS answers it differently in the two places. The account model says **a user**. The
pricing model says **a seat**.

For a multi-location business both answers are wrong, and because they are wrong in the same
way, fixing them separately never works.

Res0 fixes the boundary once:

- **The group is the account.** An Auth0 Organization, not a `tenant_id` column.
- **The venue is the unit.** A Stripe subscription quantity, not a renegotiation.
- **Entitlement is an identity fact.** Subscription state feeds back into what members can do.

Why hospitality proves it hardest: staff churn is the highest-variance, least value-correlated
number in the business, so per-seat pricing bills you for noise. Venues are what generate
revenue and what open and close. And scope is operationally real — a GM at venue three should
not see venue seven's numbers.

## What it does

A hospitality group signs up, invites its staff, and adds its venues. Publishing a venue's
guest menu is gated on the subscription being live, and the bill tracks the number of active
venues.

Photograph a paper menu and the venue's guest page builds itself.

## Stack

| Concern | Service | How it got here |
|---|---|---|
| Auth | Auth0 Organizations | `stripe projects add auth0/client` |
| Database | Neon Postgres | `stripe projects add neon/postgres` |
| Hosting | Vercel | `stripe projects add vercel/project` |
| AI | OpenRouter | `stripe projects add openrouter/api` |
| Payments | Stripe Billing | per-unit subscription, quantity = venues |

Every provider above was provisioned from the terminal via **Stripe Projects** — into our own
accounts, with credentials written straight to `.env`. No dashboards.

## Getting started

```bash
npm install
stripe projects link          # pulls the same provisioned credentials
stripe projects env --pull    # writes .env
npm run db:migrate            # applies db/schema.sql to Neon (idempotent)
npm run dev
```

Requires Node ≥ 20 and the Stripe CLI with the `projects` plugin.

> Read `NEON_POSTGRES_CONNECTION_STRING`, not `DATABASE_URL` — Neon writes the former.
> The Auth0 callback path is `/auth/callback` (SDK v4), not `/api/auth/callback`.

## Status

Hackathon build. The pattern is real and the customer shape behind it is real — an 8-venue
group in Bangkok. The code is one afternoon old. Nothing here is in production.

## Licence

MIT
