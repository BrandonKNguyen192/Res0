# Assignments — one sheet per person
### Aligned to the official build guidelines. Companion to `RUNBOOK.md`.

## THE GATE — projects without these are not judged at all

| Requirement | Owner | Deadline |
|---|---|---|
| Auth0 **provisioned via Stripe Projects** (not the dashboard) | **C** | before noon |
| Payments powered by Stripe | **B** | 15:00 |
| On the **Stripe Leaderboard**, code `auth0-sanfrancisco-2026` | **C** | **14:00** |

## What is actually scored — 1–5 each, and none of it is architecture

**Innovative use case · Clear and appealing visual design · Engaging presentation**

Plumbing quality earns **zero points directly.** It makes the gate work and it carries Q&A.
Build it correctly, then stop. Design and rehearsal are where the score is.

**Shared anchors:**

| Time | Everyone |
|---|---|
| 12:30–13:00 | Contract together · **ask hosts how the leaderboard works** · commit to the AI menu (RUNBOOK §3) or not |
| **15:00–15:20** | **MERGE — all three stop.** |
| **15:20** | **A and B stop adding features.** Design + rehearsal from here. |
| 16:15–16:45 | Deploy, full rehearsal #1 |
| **17:00** | **FREEZE** |
| 17:00–17:30 | Two more full rehearsals |

**Who is C:** whoever has a **real Stripe account with a payment method.** Projects bills to it;
sandboxes can't attach one. Hard constraint, everything else is swappable.

---
---

# PERSON A — Identity

**Your one job:** the group is a real boundary, and the people in it have the right scope.

### Before you leave
- [ ] After C provisions: `git clone https://github.com/BrandonKNguyen192/Res0` then
      `stripe projects link`. **Confirm you land on the same Auth0 tenant as C**, not your own —
      if not, say so immediately.
- [ ] Auth0 dashboard (Projects does **not** do these):
  - [ ] **Enable Organizations**; create `soho-hospitality`, `north-shore-group`
  - [ ] Roles `owner` / `manager` / `staff`
  - [ ] **Callback: `http://localhost:3000/auth/callback`** — SDK v4.
        **`/api/auth/callback` is v3 and is failure #1 in the reference doc.** Add the Vercel
        URL when C has it.
  - [ ] Logout: `http://localhost:3000`
- [ ] `git checkout -b feat/identity`

### 13:00–14:00
Login, callback, session carries `org_id`, org picker.
> **Checkpoint 14:00:** two users, two orgs, page prints which. Not there by 14:15? Hardcode the
> org switch and move on.

### 14:00–15:00
Members list, roles, invitations. **Every read scoped by `org_id`.**
> **Checkpoint 15:00:** an invited second user sees only their org's data.

### 15:00 merge
Delete **only** your `getSession` stub. Leave B's alone. Stay at the table while C boots it.

### 15:20 onward — you are done adding features
Help C with the visual pass, build demo data that looks lived-in, and write your Q&A answers.
**Resist shipping one more thing.** Anything you add after 15:20 lands on C at the worst time
and earns nothing on the rubric.

### Demo
Q&A on identity: Organizations vs a tenant column, how roles reach the app, why you trust the
token instead of shadowing a user table. Narrate only if you're the steadiest speaker.

### Your files
`app/api/auth/**` · `lib/auth.js` · login · org picker · `app/org/members/**`
**Never touch:** `app/api/stripe/**`, `app/venues/**`, the visual layer, or C's
`lib/contract.js` beyond your own stub.

### Cut, in order
1. Role-scoped nav → one view, say the model out loud
2. Invitations UI → seed the second user by hand
**Never cut:** org scoping — "multi-user" is in the brief.

---
---

# PERSON B — Billing

**Your one job:** payments work, and the subscription is the source of truth.

### Before you leave
- [ ] `git clone https://github.com/BrandonKNguyen192/Res0`, then `stripe projects link`
- [ ] Stripe **test mode**: product **Res0**, recurring monthly, **per-unit** ~$29/venue
- [ ] `stripe listen --forward-to localhost:3000/api/stripe/webhook` — confirm `stripe trigger`
      reaches you
- [ ] Customer Portal enabled
- [ ] `git checkout -b feat/billing`

> Your work is **Stripe Billing**, entirely separate from Stripe Projects. You are not blocked
> on C for any of it.

### 13:00–14:00
Checkout session route. Webhook receiver verifying signatures and logging.
> **Checkpoint 14:00:** `stripe trigger checkout.session.completed` reaches your handler.

### 14:00–15:00
Webhook writes `status`/`quantity`/`periodEnd` against the **org**. Handle
`checkout.session.completed`, `customer.subscription.updated`, `.deleted`. Idempotently —
store the event id. `stripe_customer_id` on the **org**, never the user.
> **Checkpoint 15:00:** paying in test mode flips stored state via the webhook.

### 15:00 merge
Delete **only** your `getEntitlement` stub.

### 15:20 onward — you are done adding features
Make subscription state **visible on screen** (that's a design contribution, not a feature),
then help C polish, build demo data, and write your Q&A answers.

### Demo
You may narrate the money beat. Otherwise Q&A on billing.
**The line that scores:** *"Driven by the webhook, not the redirect — the subscription is the
source of truth, so this is correct even if the browser never comes back."*

### Your files
`app/api/stripe/**` · `lib/billing.js` · `app/billing/**` · subscription banner
**Never touch:** `app/api/auth/**`, `app/venues/**`, the visual layer.

### Cut, in order
1. Quantity sync → fixed quantity, say it out loud
2. Customer Portal → skip
3. Idempotency store → keep the handler, drop the event-id table
**Never cut:** Checkout + the webhook. That's the gate.

---
---

# PERSON C — Platform, design & integration

**Your one job:** the gate is satisfied, the seam holds, and it *looks* like a product.

**You own two of the three scored axes** (visual design, and the demo you drive). You are also
the only person who can lose us the gate. Prioritise in that order.

### Before you leave — provisioning is the critical path
```bash
stripe login && stripe plugin install projects
stripe projects billing add                 # REAL account — sandboxes can't attach one
stripe projects billing update --limit 25   # real money. cap it.
git clone https://github.com/BrandonKNguyen192/Res0 && cd Res0
stripe projects init Res0                   # MUST be first
stripe projects catalog auth0 --json
stripe projects add auth0/client            # ← THE GATE. Manual setup does not count.
stripe projects add neon/postgres
stripe projects add vercel/project
stripe projects add openrouter/api          # if doing the AI menu
stripe projects env --pull && stripe projects env
```
- [ ] **Commit `.projects/state.local.json`** — A and B `stripe projects link` off it. No keys
      in Slack. **Verify all three land on the same Auth0 tenant.**
- [ ] Next.js + `@auth0/nextjs-auth0` + `stripe`, **booting**
- [ ] Schema → Neon (`drizzle-kit push`). Read **`NEON_POSTGRES_CONNECTION_STRING`**, not
      `DATABASE_URL`.
- [ ] `lib/contract.js` with **both** stubs · three branches pushed
- [ ] If Auth0 provisioning 403s, resolve it **this morning** — it threatens the gate

### 12:30–13:00
**Register on the Stripe Leaderboard, code `auth0-sanfrancisco-2026`.** Ask a host for the
mechanism. Confirm the entry is visible.

### 13:00–14:00
App shell, nav, venue list + add, on both stubs. Seed script.
> **Checkpoint 14:00:** we are **on the leaderboard**, and adding a third venue is blocked on
> stubs alone. The stub returns `quantity: 2` so you hit the paywall in hour one.

### 14:00–15:00
AI menu generation (photo → typed JSON → guest page) + the blocked state with a real upgrade
path.

### 15:00–15:20 · MERGE — you run it
A and B delete their own stubs; **you fix what the real shapes break.** Boot, walk the path,
report what you found. Riskiest twenty minutes of the day, and doing it now instead of at 17:00
is the main reason teams finish.

### 15:20–16:15 · **DESIGN BLOCK — treat it as a scored feature, because it is**
Type, spacing, the generated-menu screen, empty states, the blocked state. Make it look like a
product rather than a scaffold. Put A and B to work here.

### 16:15–16:45
`vercel --prod` — **Projects doesn't deploy code, that's you.** Full rehearsal #1. Confirm the
leaderboard entry points at the deployed URL if that's what the mechanism wants.

### Demo
**You drive.** Open on the terminal: `stripe projects status` — *"Auth0, Neon, Vercel and
OpenRouter, provisioned from the terminal. We never opened a dashboard."*
If a fix takes >20 seconds mid-demo, **switch to the deployed version.**

### Your files
`lib/contract.js` (custodian) · `.projects/**` · `.env` · schema + migrations · `app/venues/**`
· `app/layout` · shell + nav · `components/**` · the whole visual layer · `scripts/seed.mjs`

### Cut, in order
1. AI menu → costs the innovation axis, but survivable
2. Vercel deploy → demo localhost, but you lose the failure fallback
**Never cut:** the leaderboard, Auth0-via-Projects, visual polish.

---
---

## The four things Stripe Projects does NOT do — assigned by name

| Not done by Projects | Owner |
|---|---|
| Deploy code (`vercel --prod`) | C |
| Create DB schema (`drizzle-kit push`) | C |
| Set Auth0 callback URLs | **A** |
| Anything to do with Stripe Billing | **B** |
