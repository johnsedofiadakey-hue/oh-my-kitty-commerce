# Launch Checklist

Status as of 2026-08-19. Checked items are verified working in production
(`ohmyk1tty.web.app`, Cloud Run). Unchecked items are either deliberately
deferred by the store owner or require a business decision, not more code.

## Infrastructure

- [x] Firebase project configured, secrets via env vars (not git)
- [x] Cloud Run deployment via Firebase Hosting rewrite
- [x] Firebase Admin IAM permissions correct (`roles/firebase.admin` on the
      Cloud Run service account)
- [x] Firestore daily automated backups, 7-day retention (see
      [SECURITY.md](SECURITY.md#backups-and-recovery) for restore procedure)
- [ ] Custom domain — explicitly skipped for now; `ohmyk1tty.web.app` is live
      and sufficient for launch

## Security

- [x] Firestore rules: allow-list reads, all writes server-only, catch-all deny
- [x] Storage rules: staff-only writes, image-type + 10MB size validation,
      catch-all deny
- [x] Baseline HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`,
      `Referrer-Policy`, `Permissions-Policy`, HSTS)
- [x] Session cookies are `httpOnly`, `secure` in production, `sameSite=lax`
- [x] Payment webhook: signature verified, then independently re-verified against
      Paystack's API before marking an order paid; replay-safe
- [x] Checkout prices are computed server-side from stored variant records —
      never trusted from the client
- [x] No secrets or service-account keys committed to git
- [ ] Rate limiting / Firebase App Check on public endpoints — not implemented;
      see SECURITY.md for current mitigations and rationale

## Core Flows (manually verified in browser)

- [x] Storefront browse → cart → checkout
- [x] Order tracking (`/track`) by order number + phone
- [x] Admin login, dashboard, and CRUD for products/orders/customers/promotions
- [x] POS sale, refund/void with manager approval, order lookup
- [x] Content/CMS editing (WhatsApp number, pickup location) reflected live on
      storefront

## Quality

- [x] `npm run check` (lint, typecheck, tests, build) passes
- [x] Firestore rules tests pass (`npm run test:rules`)
- [x] SEO basics: metadata, `robots.ts`, `sitemap.ts`, canonical URLs
- [x] Error/loading/not-found boundaries for storefront, admin, and POS
- [x] Accessibility: form labels, image alt text, icon-button aria-labels,
      keyboard-dismissible drawers, skip-to-content link in admin, adequate
      color contrast on core text
- [ ] Full performance/Lighthouse audit — not run in this pass; spot-checked
      only via manual browser testing

## Business / Content (owner decision, not code)

- [ ] Taxonomy populated (concerns, product types, routines) — admin UI is
      ready; needs real category values from the store owner
- [ ] Final product catalogue uploaded via admin
- [ ] Delivery rules reviewed for launch pricing/timing
- [ ] Policy text (returns, privacy, terms, delivery) reviewed for accuracy

## Explicitly Deferred (owner's call, out of scope for this pass)

- [ ] Paystack card payments — checkout code and webhook handling exist and
      are wired, but the store owner will bring live Paystack credentials later

## Notifications

- [x] Arkesel SMS wired and live-tested: order confirmed/paid, ready for
      pickup, and out for delivery each send a customer SMS (`src/lib/notifications/`).
      Skipped when the order has no phone on file, or when `ARKESEL_API_KEY`/
      `ARKESEL_SENDER_ID` aren't set — failures are logged, never block the
      order/fulfilment update itself.
- [ ] The test API key used during development should be revoked/rotated in
      the Arkesel dashboard once a permanent key is issued, and the permanent
      key set as a Cloud Run env var (never committed) — see `.env.example`.

## Before Flipping The "Open For Business" Switch

1. Confirm the owner account exists and can sign in (`scripts/bootstrap-owner.ts`)
2. Upload the real product catalogue and set taxonomy
3. Review delivery rules and policy pages for accuracy
4. Do one real end-to-end order as a test (cart → checkout → admin fulfilment →
   `/track`) before announcing publicly
5. When Paystack is ready: test with Paystack's test keys first, confirm the
   webhook fires and marks an order paid, only then switch to live keys
