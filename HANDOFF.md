# Handoff — the seam is implemented, here is what's left in each lane

The core app (venues, members, menus, paywall) runs credential-less on stubs, exactly as
`lib/contract.js` promised. Both stub bodies have now been **replaced with real
implementations that fall back to the stubs** until their service is provisioned — so
nothing breaks today, and nothing needs rewriting when credentials land.

```bash
npm install && npm run dev     # works right now, no .env needed
```

## What is already real (don't rebuild)

| Piece | Where |
|---|---|
| Auth0 v4 session → seam shape | `lib/auth0.js`, `middleware.js`, `lib/contract.js` getSession() |
| Entitlement from webhook-persisted row | `lib/contract.js` getEntitlement() ← `entitlements` table/Map |
| Stripe Checkout (quantity = venues + 1, or prorated quantity change if subscribed) | `app/api/stripe/checkout/route.js` |
| Stripe webhook — **only writer** of entitlement | `app/api/stripe/webhook/route.js` |
| Customer Portal | `app/api/stripe/portal/route.js` |
| Billing page buttons (live once STRIPE_* set) | `app/(app)/billing/page.jsx` |
| Neon store behind the same `lib/db.js` API (in-memory fallback intact) | `lib/db.js`, `db/schema.sql`, `npm run db:migrate` |

## C — after `stripe projects add …` and `env --pull`

```bash
npm run db:migrate     # idempotent; creates venues/members/entitlements on Neon
npm run dev            # seed runs on first dashboard visit — org opens lived-in
git add .projects/state.local.json && git commit    # teammates `stripe projects link`
```

## A — Identity (what's left)

1. Auth0 dashboard (Projects can't): enable **Organizations**, create `soho-hospitality` +
   `north-shore-group`, roles, members. Callback **`/auth/callback`** (v4! not
   `/api/auth/callback`) for localhost + Vercel; logout `http://localhost:3000`.
2. Organization-scoped login: org picker or `/auth/login?organization=org_x`. A session
   without an `org_id` claim is treated as signed out (see `contract.js`).
3. Roles: an Auth0 Action writing two claims on the token —
   - `https://res0.app/roles`: array containing one of `owner` · `general_manager` ·
     `beverage_director` · `server` (see `lib/roles.js`; unknown → `owner`)
   - `https://res0.app/venue`: venue slug (e.g. `above-eleven`) for venue-scoped roles
     (GM, server); omit for owner/beverage director
   Role decides nav + page access + venue scoping, enforced server-side. The demo
   "View as" switcher only exists in stub mode — real sessions make it disappear,
   and the four seeded members map 1:1 onto the four roles for test logins.
4. Members page still lists seeded rows — swap to the Org's member list if time allows.

## B — Billing (what's left)

1. Test mode: product **Res0**, recurring monthly **per-unit** price (~$29/venue) →
   `STRIPE_PRICE_ID` in `.env`.
2. `stripe listen --forward-to localhost:3000/api/stripe/webhook` → `whsec_…` →
   `STRIPE_WEBHOOK_SECRET`.
3. Enable the Customer Portal (Dashboard, test mode).
4. Walk the loop: Billing → Add a venue to the plan → `4242 4242 4242 4242` → webhook lands
   → gate lifts on the venues page. **The webhook flips it, not the redirect** — that's the
   Q&A line.

## Demo notes

- Entitlement stub (no Neon, no Stripe): `active`, quantity 2 — third venue blocks, as
  designed. With Neon + Stripe: org starts `none`, everything gated until real checkout.
- Guest pages: `/m/above-eleven` (published by seed), `/m/charcoal-bkk` (draft).
- Menu extraction degrades honestly: no OpenRouter key → labelled sample, `live: false`.
