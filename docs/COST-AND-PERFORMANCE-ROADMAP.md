# Cost & Performance Roadmap

This is a backlog, not a to-do list — nothing here needs doing yet. It exists so a future session (or a future version of this conversation) doesn't have to rediscover this reasoning from scratch. Each item names what it fixes, why it isn't done now, and what should trigger picking it up.

## Baseline (recorded 2026-09-05)

- Firebase project cost: **$0.55** for the month, on the Blaze (pay-as-you-go) plan — effectively free.
- Cloud Run (hosts the whole app): ~8,900 vCPU-seconds and ~38,200 requests over 30 days, both under 5% of their free monthly allowances. Not a near-term cost concern at any plausible traffic growth for this business.
- Cloud Storage (product photos): a few cents over the free tier (`bytes stored over 1GB`, `bandwidth over 10GB` per the Firebase console) — normal and expected to grow slowly with catalogue size and traffic.
- Firestore reads briefly exceeded the free 50,000/day allowance once (53K vs 50K) — largely attributable to that day's own development/testing activity (repeated local dev-server sessions, verification scripts), not organic customer traffic. Firestore overage pricing is cheap regardless (~$0.06 per extra 100,000 reads).
- Collection sizes at baseline: 23 products, 2 orders, 2 payments, 2 customers, 76 media assets, 610 audit log entries (now capped at 300 on read), 25 inventory movements (now capped at 500 on read).

**The actual future cost/speed risk for this app is not customer storefront traffic** (already optimized — see below) **— it's admin dashboard usage against a growing historical order/payment/customer list.** Several admin queries read the *entire* orders/payments/customers collections on every single admin page view, to compute all-time totals correctly. That cost is currently tiny (2 orders) but scales linearly with total lifetime order count, not with daily traffic. See "Admin read reduction" below.

## Already done (2026-09-05)

- Storefront pages (`getStorefrontCatalogue`) used to list the entire media library on every visit just to resolve a handful of product images. Now fetches only the specific media documents referenced by live products (`findMediaByIds`, targeted `where(documentId(), "in", ...)` queries). This was the single highest-traffic unbounded read in the app — fixed with zero behavior change.
- `auditLogs` capped to the 300 most recent (was unbounded, already at 610 and growing forever with every admin action — pure display, nothing depends on the full history).
- `inventoryMovements` capped to the 500 most recent (was unbounded — it's an audit trail; current stock comes from the variant document, not this ledger).

## Deferred: full-collection scans that should become targeted queries

Found during the Firestore read audit (2026-09-05). Each of these reads an entire collection just to find one document by ID/field — a `where(...)` query would return the identical result for a fraction of the reads, with **zero change in behavior**. Not done yet because at current collection sizes (1-5 documents each) they cost nothing; the risk of touching money-handling/transaction code isn't worth it until there's real volume to justify it.

| What | Where | Why deferred |
|---|---|---|
| Find a payment by order ID | 6+ call sites in `operations.ts` (refunds, receipts, idempotency replay) — several run *inside* live payment transactions | Highest value long-term (also reduces transaction lock contention as order volume grows), but touches checkout/refund code directly — needs its own careful, isolated pass with real testing |
| Find an order by order number | `trackOrder` (public order-tracking page) | Simple, low-risk fix — good candidate to do early, even before volume grows, since it's read-only and customer-facing |
| Match a customer by phone/email | `resolveCustomerId`, runs on every checkout and POS sale | Currently 2 customers total — zero benefit today. Revisit once the customer list is large enough that a full scan is meaningfully slower/costlier |
| Look up a promo code | `evaluatePromotionCode` | Small, bounded collection (you create promo codes yourself) — low urgency regardless of order volume |
| Check for an already-open POS shift | `openPosShift` | Tiny collection (grows ~1-2/day per staff member), not a real cost driver |
| Resolve product photos when building an order | `buildOrderItems`, inside the order-creation transaction | Same fix as the storefront media win above, but inside the checkout transaction — deliberately not bundled with that fix given the stakes of touching checkout code |

## Admin read reduction — three options, when order volume grows

The real lever, described in detail during planning on 2026-09-05. All three address the same root problem (admin pages recompute all-time totals by reading full history every time) with increasing effort and completeness.

### Option 1 — Stop fetching data pages don't need
`getAdminOperationsData()` fetches ~12 collections (including full order/payment/customer history) for *every* admin page — Products, Settings, Taxonomy included, even though only Dashboard, Orders, and Financial actually use that data. Splitting the fetch so unrelated pages skip the expensive parts would cut total admin reads substantially with **no correctness risk** — it only changes what gets fetched, not any calculation. **Recommended first step whenever this becomes worth doing.**

### Option 2 — Firestore aggregation queries
Firestore can compute `count()` and `sum()` server-side in one cheap operation instead of reading every document and summing in application code. Works cleanly for simple totals (all-time revenue, order count). Does **not** work for the more detailed numbers — per-product margin needs to look inside each order's line items, which aggregation queries can't do — so this helps the top-line P&L specifically, not the full picture. Good complement to Option 1, not a replacement for Option 3.

### Option 3 — Running totals, updated as orders happen (the complete fix)
Instead of recalculating all-time revenue by re-reading every order, maintain a small running-total document that updates itself atomically the moment an order is paid, refunded, or cancelled — same idea as a bank balance instead of re-adding every transaction ever made. This is what makes admin page cost flat forever, regardless of total order count.

**Why this is higher effort than it sounds** (detailed 2026-09-05, preserved here for reference):
1. Every place money moves through the app — order creation, payment confirmation, refund, cancellation/deletion, POS sale — needs its own correct increment or decrement. Missing even one (e.g., forgetting to subtract on refund) produces a number that's silently and permanently wrong, not a crash — much harder to catch than a bug that fails loudly.
2. Two orders paid at nearly the same moment need the update done as an atomic transaction (read-add-write as one indivisible step), or one update can silently overwrite the other and a whole order's revenue disappears from the total. This is a well-known, genuinely easy-to-get-wrong category of bug.
3. It's not really "one number" — the Financial page already supports 7-day, 30-day, and custom date ranges, not just all-time. Making those fast too means running totals *per period* (e.g., per month), which is a small system to design, not a single counter.
4. Turning it on requires a one-time backfill calculation to seed correct starting values from existing history — get that wrong and everything afterward is wrong by the same fixed offset.
5. The safe version of this also includes a periodic reconciliation check (recompute the true total from scratch occasionally, alert if it's drifted from the running total) — extra infrastructure beyond the counters themselves, but the only way to actually trust the number on the dashboard long-term.

**Trigger to revisit:** once order volume is in the hundreds and admin dashboard checks happen many times a day — i.e., once the linear-growth-with-history problem is actually being felt, not before.

## Speed / performance

Overlaps heavily with the cost items above — fewer reads generally means faster page loads too, especially for admin pages doing 400+ document reads per view today. A few additional, distinct levers:

- **Cloud Run cold starts.** `min-instances` is currently unset (scales to zero when idle), which is why it's free — but the first request after an idle period pays a cold-start penalty (roughly hundreds of milliseconds to a couple seconds). Setting `min-instances: 1` would eliminate that at the cost of a small continuous charge instead of $0 when idle. Not worth it at current traffic; worth reconsidering if admin/staff start noticing a slow "first load of the day."
- **`force-dynamic` on pages that don't need live data.** Every admin page currently disables Next.js's own caching entirely, guaranteeing a fresh Firestore fetch on every view — correct for money-sensitive pages (Orders, Inventory, Financial) but likely unnecessary for slower-changing config pages (Settings, Taxonomy, Delivery rules). Allowing those a short cache window (a few seconds to a minute) would speed up repeat views and reduce reads, at the cost of very minor staleness — worth doing selectively, not broadly, and only on pages where staff wouldn't be confused by a few seconds' lag.
- **Homepage motion/animation weight.** The cinematic homepage (GSAP-scrubbed scroll sections) hasn't been profiled for actual load/runtime performance on real mid-range phones. Worth a real device-based performance pass (Core Web Vitals, main-thread work) before assuming it's fine — no data collected on this yet, flagging as unmeasured rather than asserting a problem.

## How to decide when to act

Don't do any of this pre-emptively. Reasonable triggers:

- **Admin reads / Option 1:** when admin page loads start feeling noticeably slow, or when a monthly Firestore cost consistently shows up as more than pocket change.
- **Option 3 (running totals):** when order volume is in the hundreds and the linear-growth-with-history cost is measurably real, not hypothetical.
- **The deferred targeted-query fixes:** opportunistically, one at a time, whenever touching that specific code path for an unrelated reason anyway — or if any of those collections (customers, orders, payments) grow enough that a full scan is visibly slow.
- **Cold starts / caching tweaks:** if staff actually complain about a slow first admin load, not before.
