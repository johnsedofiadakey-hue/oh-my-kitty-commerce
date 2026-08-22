# Build Log — Oh My Kitty Commerce

This is the accurate, current record of what has actually been built in this project and how — as opposed to the other files in `docs/`, which were written as upfront planning specs before/during initial implementation and have since drifted (several describe features as "not yet built" that have since shipped). Treat this file as the source of truth for "what exists today"; treat the other `docs/*.md` files as historical design intent, useful for the *why* behind early decisions but not reliable for current state.

Written from the actual git history (62 commits, 2026-08-16 through 2026-08-22), not from memory — every claim below traces to a real commit.

---

## 1. What this is

A Firebase-backed feminine wellness commerce platform for **Oh My Kitty**, a Ghana-based (Accra-Madina) store selling intimate care products — infection care sets, boric acid, period care, feminine wash, libido support, razor-bump/genital-wart treatments, herbs & supplements. Three surfaces in one codebase:

- **Storefront** — public shop, cart, checkout, order tracking
- **Admin** — staff-facing management console
- **POS** — in-person point-of-sale, offline-capable

Live at **ohmykittygh.com**, deployed on Google Cloud Run, backed by Firestore/Firebase Auth/Firebase Storage.

---

## 2. Stack

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Framework | Next.js (App Router) | ^16.3.1 | `output: "standalone"`, Turbopack |
| UI | React | ^19.2.8 | Server Components by default |
| Language | TypeScript | ^6.0.3 | strict |
| Validation | Zod | ^4.4.3 | every input schema, both admin actions and API routes |
| Backend | Firebase (Firestore, Auth, Storage) | firebase ^12.17.1 (client), firebase-admin ^14.2.0 (server) | |
| Motion | GSAP | ^3.15.0 | storefront cinematic sequences |
| Offline storage | idb | ^8.0.3 | POS's offline sale queue |
| Test runner | Vitest | ^4.1.10 | + `@firebase/rules-unit-testing` for Firestore rules tests |
| Deploy target | Google Cloud Run | — | via a committed `Dockerfile`, **not** Firebase App Hosting (see §4) |
| CDN/edge | Firebase Hosting | — | rewrites everything to the Cloud Run service |
| Payments | Paystack | — | card + mobile money, both online and POS |
| SMS | Arkesel | — | order status + admin new-order alerts |

No image-processing library (`sharp` aside — see below), no state-management library, no CSS framework — hand-written `globals.css` with CSS custom properties for the design system, no component library.

`npm run check` = `lint && typecheck && test && build`, the standard gate before every deploy.

---

## 3. Architecture

### Commerce core
Almost all business logic lives in `src/lib/commerce/operations.ts` behind a consistent shape:

```
operationName(context: CommerceContext, actor: CommerceActor, input) 
```

- **`CommerceContext`** — `{ repo, roles?, now?, id?, transaction? }`, injected per-request
- **`CommerceActor`** — `{ uid, roleIds, permissionOverrides?, posEnabled?, displayName?, email?, system? }` — resolved from the session cookie server-side, never trusted from the client
- **`CommerceRepository`** — the Firestore access interface, with a parallel in-memory implementation (`memory-repository.ts`) used by tests
- Every mutating operation calls `assertCan(context, actor, permission)` first, then usually `writeAuditLog(...)` after
- `withTransaction(...)` wraps atomic multi-document writes (order + payment + inventory movement together, etc.)

### Permissions
`src/lib/permissions/permissions.ts` defines the permission strings and three built-in roles (Owner, Manager, Sales Staff — `system: true`, can't be edited/deleted). Custom roles are stored in Firestore and resolved through `getEffectiveRoles()` — this used to be inconsistent (see §5.9) but every permission check in the app now goes through it uniformly.

### Auth
Two trust domains, deliberately kept separate:
- **Server-side session cookie** (`src/lib/auth/server.ts`, `getRequiredAdminActor()`) — gates every admin/POS page and server action, verified with `checkRevoked: true`
- **Client-side Firebase ID token** — drives Firestore/Storage security rules directly from the browser (product/category image uploads, etc.); refreshed proactively before writes since it doesn't always auto-refresh on its own (see §5.7)

### Data model
Firestore, no ORM. Key collections: `products`, `variants` (subcollection), `orders`, `payments`, `customers`, `media`, `contentBlocks`, `users` (staff accounts — not `staffUsers`, despite the name), `roles`, `inventoryMovements`, `auditLogs`, `promotions`, `deliveryRules`, `posShifts`. Firestore Timestamps are **not** real `Date` instances at runtime — every date field is read defensively.

### Notifications
`src/lib/notifications/order-notifications.ts` — fire-and-forget SMS via Arkesel on order-confirmed / ready-for-pickup / out-for-delivery, plus a new-order alert to the owner's phone. Never awaited from a request handler that needs to respond quickly. Templates are admin-editable content blocks, not hardcoded strings (§5.19).

### Payments
Paystack for both online checkout and POS (card + mobile money). The pattern used everywhere: create the order as `PENDING_PAYMENT` with **no inventory decrement**, verify the charge server-side, only then confirm the order and decrement stock. Never trusts a client-supplied payment status.

---

## 4. Deployment & infrastructure

- **Cloud Run**, not Firebase App Hosting — App Hosting's buildpack only supports Next.js 12–15 and fails on Next 16, so a committed `Dockerfile` bypasses it entirely (`gcloud run deploy --source .`, which runs the Dockerfile via Cloud Build directly).
- **Firebase Hosting rewrites everything** to the Cloud Run service (`firebase.json`, `rewrites: [{ source: "**", run: {...} }]`).
- **Gotcha discovered 2026-08-22**: Firebase Hosting can *also* hold its own static snapshot of the `public/` folder from a past plain `firebase deploy`, and that snapshot is checked **before** the rewrite — so a stale static file can silently shadow a Cloud Run update at the same path indefinitely, immune to cache-busting query strings. Fix when this happens: `firebase deploy --only hosting` to refresh the static snapshot. Worth remembering if any `public/` asset ever looks "stuck" after a deploy.
- **Custom domain**: `ohmykittygh.com`, connected 2026-08-21 (Namecheap DNS → Firebase Hosting's anycast IP). `www.ohmykittygh.com` redirects to the apex. `NEXT_PUBLIC_SITE_URL` is baked into the Dockerfile (both build `ARG` and runtime `ENV`) — **not** read from `.env.local` in production.
- **Secrets**: public Firebase web config is safe-to-commit and lives directly in the Dockerfile; real secrets (Paystack keys, Arkesel keys, admin quick-action HMAC secret) go through Google Secret Manager, referenced at runtime via `APP_ENV=production`.
- **CDN caching**: Next's default page-shell caching assumes the host version-keys its cache per deploy; Firebase Hosting caches by URL alone, so page-shell HTML is explicitly set to `must-revalidate` while `/_next/static/*` (content-hashed filenames) keeps a long-lived immutable cache. Binary assets referenced by a fixed path (hero video) additionally carry a manual `?v=` cache-busting query string bumped on every change.
- **Cost posture** (2026-08-22 pass): Firestore document count is tiny (~100 total docs across every collection), Storage is ~2.4MB, Cloud Run scales to zero when idle. The two real cost levers found and fixed: redundant per-request Firestore reads (§5.20) and unthrottled public API routes (§5.21).

---

## 5. Feature build log

Grouped by area, in the order each first shipped. Commit hashes are short SHAs from `git log`.

### 5.1 — Foundation (2026-08-16, `2f43c31`…`90c2b4b`)
Initial scaffold: Phase 0 project setup, Phase 1 commerce core (products/orders/inventory operations), Phase 2 admin baseline, admin auth bootstrap, admin product workflows, storefront shop + cart preview, the cinematic storefront redesign, product showcase + footer, full starter catalogue, category alignment with the real price sheet, core shopping flows end-to-end, and a first pass at complete storefront/admin/POS flows.

### 5.2 — Staff RBAC, offline POS, checkout/admin redesign (`f0f7bd9`, 2026-08-18)
Real staff accounts with permission-filtered access (`isStaff`/`isAdmin` claim split, per-page permission checks, invite flow, role assignment). POS gained offline-capable sales via an IndexedDB queue that replays on reconnect, a PWA manifest/icons, and a hand-written service worker (dropped Serwist/Workbox after a Turbopack incompatibility). Storefront checkout/cart restyled to match brand, real fonts (Inter + Satoshi).

### 5.3 — Deploy infrastructure churn (`a25a4f0`…`9cf4fd6`, 2026-08-18)
App Hosting config → Cloud Run Dockerfile (App Hosting's buildpack doesn't support Next 16) → Firebase Hosting rewired to point at Cloud Run instead of App Hosting. Also fixed a corrupted `package-lock.json` entry that only broke on a cold npm cache (why it passed locally, failed in every clean container build).

### 5.4 — Self-service password reset (login-page only) (`127dde1`, 2026-08-18)
The *logged-out* "forgot password" flow via `sendPasswordResetEmail` — distinct from the *logged-in* password change added later (§5.24).

### 5.5 — Mobile-optimized admin/POS, on-brand styling (`0459103`, 2026-08-18)
Slide-out admin nav drawer below 820px, POS bottom-sheet cart, admin typography/color brought in line with the storefront instead of generic dashboard chrome.

### 5.6 — Wire up admin CRUD, POS refund/void, admin shell redesign (`b9ae94a`, 2026-08-19)
Orders/inventory/customers/promotions went from view-only to fully wired (they had backend operations, just no UI action). POS refund/void with manager-approval enforcement over role limits, approver identity verified via a fresh ID token server-side. **Real bug fixed**: every "update" schema built on `createSchema.partial()` was silently resetting omitted fields back to their create-time default (Zod applies `.default()` through `.partial()`) — a plain status toggle was wiping categories/tags. Fixed at the root with regression tests. Admin shell redesigned with grouped nav + live badge counts + a dashboard surfacing what needs a decision.

### 5.7 — Checkout simplified to Paystack-only, sliding cart drawer (`0ce1ad2`, 2026-08-19)
Dropped the redundant payment-method picker (Paystack's own hosted page already asks). Cart became a bottom-sheet drawer reachable from anywhere. **Bugs fixed**: storefront was silently falling back to fake sample products live because some real Firestore products were missing array fields the code assumed always existed (now read defensively everywhere); cart wasn't clearing after a successful payment.

### 5.8 — Production-readiness pass + Arkesel SMS (`26db4d0`, 2026-08-19)
Customer order tracking (`/track`), product image upload via Storage, error/loading/not-found boundaries across all route groups, initial SEO (metadata/robots.ts/sitemap.ts), accessibility pass, expanded Firestore rules test suite (4→9 tests), baseline security headers, Storage upload validation, an audit of every API route for auth/webhook/price integrity, automated daily Firestore backups. Arkesel SMS notifications introduced (confirmed/ready-for-pickup/out-for-delivery + `/track` link), sent fire-and-forget so the 2–7s round trip never blocks a payment confirmation.

### 5.9 — Hero video, category management, shop ordering (`8ec5f19`, 2026-08-20)
First version of the autoplaying hero video (see §5.22/§5.23 for later fixes to it). Full category admin CRUD (previously seed-script-only). `homepagePriority` exposed so admins can manually order the shop/home grid.

### 5.10 — Orders/Inventory redesigned as click-to-expand rows, admin SMS alerts (`ef86154`, 2026-08-20)
Compact summary rows opening a detail drawer, instead of cramped one-line forms. `notifyAdminOfNewOrder` added — owner gets an SMS on every new order.

### 5.11 — Checkout copy, delivery notes, cart/bag rename (`3d66c78`, `570a0b1`, `52c3aed`, 2026-08-20)
Checkout copy rewritten in plain, locally-natural wording; delivery notes upgraded to a visually distinct textarea. Every customer-facing "bag" renamed to "cart." No-login "quick fulfil" links added — an HMAC-signed token lets staff update fulfilment status straight from the admin alert SMS without logging in, same trust model as the customer tracking link.

### 5.12 — Admin orders as a live queue (`a01bf7e`, 2026-08-20)
Numbered "Needs attention" queue (oldest first) + collapsed "Completed" section, inline status dropdown for one-tap changes.

### 5.13 — CDN staleness fixes (`fe8e32e`, `78d2481`, 2026-08-20)
Discovered and fixed Firebase Hosting's URL-only cache key causing stale page-shell HTML and a stale hero video after deploys — see §4.

### 5.14 — Staff invites, Manager role, real POS Mobile Money (`50ec43a`, 2026-08-20)
Staff invite now sets email+password directly instead of a manually-copied reset link. "Can use POS" toggle actually enforced (was collected, never checked). New Manager role between Owner and zero-refund-limit Sales Staff. **POS Mobile Money became real**: selecting it starts an actual Paystack charge (customer's phone gets a real USSD/PIN prompt), order is `PENDING_PAYMENT` with zero inventory impact until server-side verification succeeds — same pattern as online checkout.

### 5.15 — UI/UX polish pass (`ef86154`…`f5f76c7`, 2026-08-21)
SKU/status pill overflow fix, POS touch-target sizing, category image Storage rules (were missing entirely — every category upload was silently failing), stale-ID-token fix for image uploads (client SDK doesn't proactively refresh before a write), `next.config.ts` missing the Firebase Storage image host (uploads succeeded but rendering crashed), category tiles fixed to use their *own* uploaded photo instead of borrowing a product's, Snapchat added to footer socials, pickup "Get directions" map link at checkout, cart auto-opens on add, quick-view sheet's redundant "Explore product" button replaced with real related-product recommendations.

### 5.16 — Promotions actually work (`86ee496`, 2026-08-21)
Promotions had a full admin CRUD screen but nothing in the codebase ever read or applied one — creating a code did nothing. Built `evaluatePromotionCode` (validates against real live prices, never trusts a client-supplied discount), wired into online checkout (live preview + server-side re-validation) and POS (gated by `pos.discount`, manager-approval-required promotions gated by `pos.price_override`). `usedCount` only increments on genuine confirmation, not draft creation.

### 5.17 — Sale-price / compare-at pricing (`6ebf419`, 2026-08-21)
Same pattern as Promotions: `ProductVariant.compareAtPrice` already existed in the data model with zero UI on either end. Added the admin field and a shared strikethrough-price renderer across the shop grid, quick-view sheet, and product page.

### 5.18 — Cart cross-sell recommendations (`37666a3`, 2026-08-21)
"Goes well with your cart" row in the cart drawer, via a new read-only `/api/storefront/recommendations` route.

### 5.19 — Admin-editable SMS templates (`4528bf4`, 2026-08-21)
The three SMS templates moved from hardcoded strings into the same content-block registry as the rest of the site's editable copy.

### 5.20 — Shop-closed kill switch (`7d3391e`, 2026-08-21)
Site-wide pause on new online orders via a `proxy.ts` gate, without touching code — admin/POS/tracking/fulfil links explicitly excluded so staff keep working, checkout API re-checks the flag server-side too.

### 5.21 — Dashboard/Reports de-duplication (`eca8ec6`, 2026-08-21)
Reports was rendering the same data as Dashboard; trimmed to what's genuinely distinct (discount usage, top products by revenue).

### 5.22 — Image compression on upload (`3d9891c`, 2026-08-21)
Canvas-based resize + re-encode before every product/category upload — no new dependency, browser-native. PNGs stay PNG (transparency), everything else → JPEG, falls back to the original if compression doesn't actually help.

### 5.23 — Custom role CRUD, made to actually work (`a6f6ce3`, 2026-08-21)
The `roles` Firestore collection already existed and displayed correctly, but every real permission check in the app resolved against the static `defaultRoles` array, not Firestore — a custom role could be created and assigned but would silently grant nothing. Extracted the one code path that already got this right into `getEffectiveRoles()` and switched every call site to it. Built the actual create/edit/delete UI (grouped permission checkboxes, system roles protected, delete blocked while any staff account still holds the role).

### 5.24 — Content & Media rebuilt into a real media library (`0e8e8f4`, 2026-08-21)
Was a read-only, undeletable list plus a hardcoded logo image, despite claiming to manage "homepage media, product cutouts, public assets." Added a generic uploader not tied to any product/category, and delete (server-blocked while a product/category still references the asset).

### 5.25 — Cost fixes: caching + rate limiting (`8b04b99`, `561b3f2`, 2026-08-21)
`getContentBlocks()` had no per-request caching (unlike every other loader in the codebase) — wrapped in React's `cache()`; the shop-closed check specifically also got a 30s in-memory TTL cache since it runs on every single storefront request. Separately, `/api/checkout/paystack`, `/api/checkout/promo`, `/api/storefront/recommendations`, and `/api/track` had no rate limiting at all despite being public and unauthenticated by design — added a simple in-memory per-IP sliding-window limiter (5/min for the write-performing checkout route, 20–30/min for read-only ones).

### 5.26 — SEO, structured data, social cards, canonical domain (`364a90b`, 2026-08-21)
Custom domain `ohmykittygh.com` connected; found `NEXT_PUBLIC_SITE_URL` was still hardcoded to the old `.web.app` domain in the Dockerfile and fixed it. Added Open Graph/Twitter card images via Next's built-in `next/og` (no new dependency), JSON-LD structured data (Organization site-wide, Product per product page, FAQPage on `/faq`) — previously absent everywhere. Home/shop page metadata, sitemap `changeFrequency`/`priority`, `public/llms.txt` for AI crawlers.

### 5.27 — Self-service password change (`ad7faa4`, 2026-08-22)
New `/admin/account` page — any signed-in Owner or Manager can change their own password (current-password reauthentication required). Firebase Auth automatically invalidates every other session for the account the moment the change succeeds; the current tab re-signs-in immediately to keep working. Two real bugs found and fixed during live verification: `auth.currentUser` can be null right after a fresh page load while the client SDK is still rehydrating (fixed via `onAuthStateChanged`), and an explicit `revokeRefreshTokens` call was redundant and self-defeating since Firebase already does this automatically (removed it, reordered the follow-up action to run after the new session is established).

### 5.28 — Hero video re-encode (`7ce56d4`, 2026-08-22)
The original hero video's source footage was genuinely soft; a prior fix (§5.13-adjacent, `579e9a5`) had already pushed sharpening as far as it usefully could. Re-encoded from a cleaner, higher-bitrate source the user provided — verified the source content was actually correct before using it (one candidate file looked promising by name but was unrelated footage entirely). Net result: sharper and smaller than what was live.

### 5.29 — Footer credit link (this session, 2026-08-22)
Added a subtle "Built and powered by stormglide.io" credit link at the bottom of the storefront footer.

---

## 6. Known gaps / deliberately not built

- **Mobile Money OTP flow**: Paystack's mobile money charge can require an OTP-entry step instead of a pure USSD prompt for some networks — the current POS flow only handles the USSD case. Deliberately deferred until it's confirmed to actually happen for a real transaction, rather than building blind.
- **Editable brand logo**: still a static file (`public/brand/oh-my-kitty-logo.jpeg`), not admin-uploadable — swapping it touches multiple places (favicon, PWA icons, admin sidebar) and wasn't judged worth the risk for how rarely a logo changes.
- **FAQ/product-care placeholder copy**: a few strings (FAQ answers, "How to use"/"Ingredients" fallback text) still read like pre-launch placeholders ("will be confirmed by admin," "before public launch") — flagged but not rewritten, since it's editorial content rather than a functional gap.
- **GCP Billing Export**: not set up — cost estimates in §4 are derived from direct resource inspection (document counts, bucket size, Cloud Run config), not actual billing data. Would need this enabled for a real per-service dollar breakdown.
