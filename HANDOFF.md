# Handoff — scaffold is done, here is where your lane plugs in

The whole app **builds and boots with zero credentials** (`npm install && npm run dev`).
Every integration shows a "not configured" state until its env vars exist. The landing
page has a live status panel telling you what's still missing.

```bash
npm install
cp .env.example .env    # or let `stripe projects env --pull` write .env
npm run dev
```

## Provisioner (C) — Stripe Projects

Runbook §9 sequence, unchanged. After `env --pull`:

```bash
npm run db:migrate      # applies db/schema.sql to Neon (idempotent)
npm run db:seed         # demo dataset: Soho Hospitality + 3 venues + menus
git add .projects/state.local.json && git commit   # vault stays ignored; state is shared on purpose
```

Env names the app actually reads (see `.env.example` for all of them):
`NEON_POSTGRES_CONNECTION_STRING` (**not** DATABASE_URL) · `AUTH0_DOMAIN` /
`AUTH0_CLIENT_ID` / `AUTH0_CLIENT_SECRET` / `AUTH0_SECRET` (`openssl rand -hex 32`) ·
`APP_BASE_URL` · `STRIPE_SECRET_KEY` · `STRIPE_WEBHOOK_SECRET` · `STRIPE_PRICE_VENUE_MONTHLY` ·
`OPENROUTER_API_KEY`.

## A — Identity (Auth0)

Already built — don't rebuild: SDK v4 middleware (`src/middleware.ts`) mounts
`/auth/login|logout|callback`; sessions are read via `getSession()` and the org claim via
`orgFromSession()` in `src/lib/auth0.ts`. **The org claim IS the account** — no org on the
session, no dashboard.

Your part (Projects can't do these, runbook §9-A):
1. Auth0 dashboard: enable **Organizations**, create `soho-hospitality` + `north-shore-group`,
   roles `owner`/`manager`/`staff`, add members.
2. Application callbacks: `http://localhost:3000/auth/callback` **(v4 path — `/api/auth/callback`
   is v3 and is failure #1)** + the Vercel URL. Logout: `http://localhost:3000`.
3. Make login organization-aware (org picker or `/auth/login?organization=org_x` — small change
   in `src/lib/auth0.ts` Auth0Client options / login link in `src/app/layout.tsx`).
4. Re-run `npm run db:seed -- --org <real org_id> --name "Soho Hospitality"` so the seeded
   venues attach to the real org.

## B — Billing (Stripe)

Already built — don't rebuild:
- `POST /api/stripe/checkout` — Checkout Session, `mode: subscription`, **quantity = active
  venues**, no `payment_method_types` (deliberate), `client_reference_id = org row id`.
- `POST /api/stripe/webhook` — signature-verified; the **only writer** of
  `subscription_status` + `licensed_venues` on the org. Handles `checkout.session.completed`
  + `customer.subscription.*`. `invoice.payment_failed` arrives as `past_due` via
  subscription.updated — no extra handler.
- `POST /api/stripe/portal` — Customer Portal.
- `src/lib/billing.ts` `syncVenueQuantity()` — venue add/close reprices with proration.
  (Runbook cut-list items 1 & 4 are already done; spend your time on testing, not features.)

Your part (runbook §9-B):
1. Test mode: product **Res0**, recurring monthly price, **per-unit** ~$29/venue →
   put the price id in `STRIPE_PRICE_VENUE_MONTHLY`.
2. `stripe listen --forward-to localhost:3000/api/stripe/webhook` → put the `whsec_…` in
   `STRIPE_WEBHOOK_SECRET`.
3. Enable the Customer Portal in the dashboard (test mode).
4. Verify the loop end-to-end: dashboard → Activate subscription → `4242 4242 4242 4242` →
   webhook fires → billing badge flips to `active` → venue publish unlocks.

## The gate & the demo beat

- Entitlement logic lives in ONE file: `src/lib/entitlement.ts` (`active`/`trialing` and
  within licensed quantity). The publish button on the venue page is the enforcement point.
- **Demo beat differs from runbook §10.5 on purpose:** venues add freely (the bill follows —
  quantity sync), and **publishing** is what's blocked without a live subscription.
  Blocked publish → checkout → publish flows. Same drama, stronger thesis. Tell the narrator.
- Guest page: `/m/<slug>` — only exists while published. Seeded slugs: `soho-noodle-bar`,
  `harbourline`, `peak-and-pine`.
- AI menu (§3 play): venue page → "Extract from photo" → OpenRouter → guest page builds
  itself. Falls back to "Load sample menu" if OpenRouter is down on demo wifi.
