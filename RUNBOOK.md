# Runbook — Built Different: Auth0 × Stripe Hackathon
## Three-person plan · aligned to the official build guidelines

**Thu 30 July 2026 · Okta, 100 1st St, San Francisco · lobby check-in, floor 13**

| Time | What |
|---|---|
| 12:00 | Lunch, badges |
| **12:30–13:00** | Contract + roles. **Register on the leaderboard. Ask hosts the two questions in §1.** |
| **13:00–17:30** | Hacking — 4h30m |
| 17:30 | Demos · 18:00 judging · 18:30 winners · 19:30 out |

---

## 0. THE GATE — read this first

> **"Build Requirements (projects without will not be judged)"**
>
> - **Auth powered by Auth0 — provisioned via Stripe Projects**
> - **Payments powered by Stripe**
> - **Accessible on the Stripe Leaderboard using code `auth0-sanfrancisco-2026`**

These are **pass/fail**. A beautiful app that misses any one of them is not judged at all.

| Requirement | Owner | Done by |
|---|---|---|
| Auth0 provisioned via `stripe projects add auth0/client` | **C** | before noon |
| Payments via Stripe (Checkout + subscription) | **B** | 15:00 |
| **Leaderboard, code `auth0-sanfrancisco-2026`** | **C** | **14:00 — not 17:00** |

**Do the leaderboard registration early and confirm the entry is visible.** It is the cheapest
possible way to lose, and nobody discovers a broken submission flow at 17:25 with time to fix
it. The exact mechanism isn't in the materials we have — ask a host at 12:30, then do it.

**Manual Auth0 setup does not satisfy the gate.** It has to come through Projects. If
provisioning 403s (you already have an Auth0 account under that Stripe email), that is a
problem to solve at 11:00, not at 13:00 — see §8.

---

## 1. Two questions for the hosts at 12:30

1. **Exactly how do we get on the Stripe Leaderboard with `auth0-sanfrancisco-2026`?** Confirm
   the mechanism and whether it needs a deployed URL.
2. **How strictly is "from scratch" enforced?** We are starting from an empty repo, but confirm
   that provisioning and scaffolding done this morning is fine.

---

## 2. What the judges actually score

Three axes, 1–5 each. **Note what is absent: nothing scores architecture.**

| Axis | What it means for us | Who drives it |
|---|---|---|
| **Innovative use case** | Is this a fresh idea, or a to-do app with a paywall? | all — see §3 |
| **Clear and appealing visual design** | Does it *look* good on the projector | **C** |
| **Engaging presentation** | Are the judges leaning in for 3 minutes | narrator |

**This inverts my earlier plan.** Webhook idempotency, org-scoped reads and a clean contract
seam are still worth building — they make the requirements genuinely work and they carry Q&A —
but **they earn zero points directly.** Time spent gold-plating them is time stolen from the
two axes that are two-thirds of the score.

Consequence: **visual design and rehearsal are protected. Technical extras are the cut list.**

---

## 3. What we're building, and the innovation play

**Res0** — a hospitality group signs up, invites staff, adds venues, and is billed **per
active venue**. Publishing a venue's guest menu is gated on the subscription.

The billing insight is genuinely good: identity and billing share one boundary (the group) and
one unit (the venue), because staff churn constantly while venues are the real unit of value
and expansion. That is a strong *business* idea.

**But "innovative use case" is scored 1–5, and per-venue SaaS billing is sound rather than
exciting.** Against a room that just watched an AI comic generator, we need one thing that
makes a judge sit up.

### The play: provision OpenRouter too, and make the menu itself the magic

```bash
stripe projects add openrouter/api
```

**Photograph a paper menu → the venue's guest page builds itself.** One model call returns
typed JSON (dishes, descriptions, prices), which renders as the published guest menu that the
subscription gates.

Why this earns its scope:

- **Innovation:** the product now *does* something, rather than administering something.
- **Visual design:** a generated menu page is the most attractive screen in the app, and it is
  the screen the paywall protects. The demo has something worth looking at.
- **More Projects usage:** a fourth provider through the CLI, reinforcing requirement #1.
- **It is on-thesis, not bolted on.** "Publishing is gated on subscription" was always the
  product; this makes publishing worth paying for.

**Cost:** roughly 45 minutes of C's afternoon. Pay for it out of §7's cut list, not out of
rehearsal.

> Decide this at 12:30 and commit. Adding it at 15:00 is how teams miss the freeze.

---

## 4. The pitch — everyone learns these words

Most SaaS starts from a user account with a subscription bolted on, then discovers that real
customers are **organizations**, and that value scales with **locations**, not people.

**Res0 starts from that shape: identity and billing share one boundary — the group — and
one unit — the venue.**

- **Staff turn over constantly; the group persists.** Per-seat pricing punishes hiring.
- **A 2-venue and a 12-venue group are different businesses.** Flat rate misprices both.
- **Venues open and close.** The unit of value is the unit of expansion — a subscription
  quantity, not a renegotiation.

A GM at venue three shouldn't see venue seven's numbers; the owner sees everything. That's an
Organization with roles, not a `venue_id` column and a `WHERE` clause you must remember.

**The close:** *"We didn't build a paywall on a CRUD app. We built the billing and identity
shape multi-location businesses actually have — the org owns the Stripe customer, and
entitlement flows back into what its members can do. One of us runs a restaurant platform for
an 8-venue group in Bangkok. This is how it gets billed."*

> Confidence on the **pattern**, never on traction. "The pattern is real, the customer shape is
> real, the code is four hours old" is the strong version.

---

## 5. Roles

| | **A — Identity** | **B — Billing** | **C — Platform, design & integration** |
|---|---|---|---|
| Owns | Auth0 org config, session, members, roles | Stripe Checkout, webhook, subscription state, portal | Projects provisioning, leaderboard, repo, schema, `lib/contract.js`, venues, **the entire visual layer**, AI menu, seed, demo |

**C carries the visual axis, which is a third of the score** — so A and B must not create work
that lands on C. Once your lane is proven, help with polish and rehearsal rather than adding
features.

**C is whoever has a real Stripe account with a payment method** — Projects bills to it and
sandboxes can't attach one. Hard constraint.

---

## 6. The build

### Before 13:00 — C provisions, A and B configure (§9)

### 13:00–14:00
- **A** — Auth0 login, callback, session carries `org_id`, org picker.
- **B** — Checkout route, webhook receiver verifying signatures and logging.
- **C** — **leaderboard registration confirmed**, schema on Neon, app shell, venue list + add on
  stubs.
> **14:00 checkpoints:** two users / two orgs (A) · `stripe trigger` reaches the handler (B) ·
> **we are on the leaderboard** and the third venue is blocked on stubs alone (C).

### 14:00–15:00
- **A** — members, roles, invitations. Every read scoped by `org_id`.
- **B** — webhook persists `status`/`quantity`/`periodEnd` against the **org**, idempotently.
  `stripe_customer_id` on the org, never the user.
- **C** — AI menu generation (§3) + the blocked state with a real upgrade path.

### ⚠ 15:00–15:20 · MERGE — all three stop. C runs it.
Stubs out, real code in, boot, walk the path once.

### 15:20–16:15 · **DESIGN BLOCK — this is scored, treat it as a feature**
- **C** — the visual pass: type, spacing, the generated-menu screen, empty states, the blocked
  state. Make it look like a product, not a scaffold.
- **A and B** — you are done adding features. Help C, write the Q&A answers for your lane, and
  build the demo dataset so the app opens on something lived-in.

### 16:15–16:45 · Deploy + full rehearsal #1
`vercel --prod`. All three walk §10 end to end. **Confirm the leaderboard entry points at the
deployed URL** if that's what the mechanism needs.

### 16:45–17:00 · Polish only. **17:00 — FREEZE.**

### 17:00–17:30 · Rehearse twice more
Presentation is a scored axis. Two more full run-throughs on the network you'll present on.

---

## 7. Cut list — inverted for the real rubric

Cut from the top. **Everything above the line is unscored plumbing.**

1. Quantity sync → fixed quantity, mention it out loud
2. Role-scoped nav → one view for everyone
3. Invitations UI → seed the second user by hand
4. Customer Portal → skip
5. Webhook idempotency → keep the handler, drop the event-id store
6. ── *below this line you are damaging the score* ──
7. AI menu generation → the innovation axis takes the hit
8. Visual polish → **do not cut**, it is a third of the score
9. Rehearsal → **never cut**, it is another third

**Never cut:** Auth0-via-Projects · Stripe payments · the leaderboard entry. Those three are the
gate, not the score.

---

## 8. Known failure modes

| Symptom | Fix |
|---|---|
| `requestAccount failed with status 403` on Auth0 | You already have an Auth0 account under that Stripe email. **This threatens the gate** — resolve it this morning, with a host if needed. A manual key is a fallback for *other* providers; for Auth0 it may not satisfy the requirement. |
| `PROVIDER_NOT_LINKED` | `stripe projects link <provider>` |
| Slug rejected | `stripe projects catalog <provider>` — CLI is the source of truth |
| Auth0 login loops | Callback must be **`/auth/callback`** (SDK v4). `/api/auth/callback` is v3 and is failure #1 in the reference doc. |
| DB won't connect | Neon writes `NEON_POSTGRES_CONNECTION_STRING`, not `DATABASE_URL` |

**Projects does NOT:** deploy code (C) · create schemas (C) · set Auth0 callback URLs (**A**) ·
touch Stripe Billing (**B**).

---

## 9. Before you leave

**C — provisioning is the critical path:**
```bash
stripe login && stripe plugin install projects
stripe projects billing add                 # REAL account
stripe projects billing update --limit 25
git clone https://github.com/BrandonKNguyen192/Res0 && cd Res0
stripe projects init Res0                   # must be first
stripe projects catalog auth0 --json
stripe projects add auth0/client            # ← THE GATE
stripe projects add neon/postgres
stripe projects add vercel/project
stripe projects add openrouter/api          # if doing §3
stripe projects env --pull && stripe projects env
```
Commit `.projects/state.local.json` so A and B `stripe projects link` for the same credentials —
**verify they land on the same Auth0 tenant.** Then: Next.js + `@auth0/nextjs-auth0` + `stripe`
booting, schema pushed, `lib/contract.js` with both stubs, three branches.

**A — Auth0 dashboard** (Projects doesn't do these): Organizations enabled · orgs
`soho-hospitality` + `north-shore-group` · roles `owner`/`manager`/`staff` · **callback
`http://localhost:3000/auth/callback`** + the Vercel URL · logout `http://localhost:3000`.

**B — Stripe Billing** (separate from Projects): test mode · product **Res0**, recurring
monthly, **per-unit** ~$29/venue · `stripe listen --forward-to localhost:3000/api/stripe/webhook`
verified · Customer Portal enabled.

**Everyone:** Node ≥ 20 · chargers · ID (21+) · **hotspot**.

---

## 10. The demo (3 minutes) — a scored axis, so rehearse it

**One narrator, C drives, third on recovery.** A and B take Q&A on their own lane afterwards.

1. **Terminal, 15s.** `stripe projects status` — *"Auth0, Neon, Vercel and OpenRouter,
   provisioned from the terminal. We never opened a dashboard."*
2. Login → org picker → Soho Hospitality. *"Auth0 Organizations — a group is a real boundary,
   not a column in a table."*
3. Members list, invite a manager. *"Roles come from Auth0."*
4. **Photograph a paper menu → the guest page builds itself.** The prettiest screen; let it land.
5. Venues at the plan limit → add one → **blocked.**
6. Checkout, `4242 4242 4242 4242`, return → **block gone.** *"Driven by the webhook, not the
   redirect — the subscription is the source of truth, so this is right even if the browser
   never comes back."*
7. The §4 close, plus: *"Stripe stood the stack up and Stripe charges for it."*

**If a fix takes more than 20 seconds, switch to the deployed version. Nobody knows what you
planned.**

---

## 11. What ports back to Komodos

| Built today | Ports to |
|---|---|
| Auth0 Organizations as tenant boundary | Replaces hand-rolled JWT + scrypt in `server/auth.js`; maps to the ADR-0002 tenant |
| Org → Stripe customer, per-unit subscription | The per-venue pricing the roadmap wants — $350–500, anchored against MarginEdge |
| Webhook → entitlement | Gates live-tenant features; pairs with demo/live mode (ADR-0006) |
| Photo → structured menu JSON | The invoice-extraction pattern in ADR-0008, rehearsed on an easier document |
| Neon Postgres | A live rehearsal of ADR-0003 — off the JSON store, off the home box |

Komodos has **no billing at all** today — ADR-0008 closed on exactly that.

**Kit:** https://github.com/mtliendo/auth0-hackathon-project-and-notes ·
**Event:** https://luma.com/builtdifferent-auth0-stripe
