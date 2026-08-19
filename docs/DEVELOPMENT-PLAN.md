# Development Plan

## Build Strategy

Do not build the entire platform in one prompt. Build in phases with acceptance criteria at each gate.

The order is deliberate:

1. Architecture and safety first.
2. Shared commerce core second.
3. Admin and POS before the expensive cinematic storefront.
4. Conventional storefront commerce before advanced motion polish.
5. Production hardening last.

## Phase 0 - Project Foundation

Goal: create a working, Firebase-ready app foundation without real Firebase credentials.

Status: baseline scaffold implemented. The repo now includes a Next.js App Router shell, Firebase placeholder initialization, route groups for storefront/admin/POS, Firebase emulator config, starter Firestore/Storage rules, local seed data, RBAC helpers, commerce domain types, and unit tests. Firestore rules tests run via `npm run test:rules` and require JDK 21+ (the Firebase CLI's emulator no longer supports older Java runtimes) — install with `brew install openjdk@21` and point `JAVA_HOME` at it for that command if your default `java` is older.

Tasks:

- scaffold Next.js App Router with TypeScript
- configure lint, format, typecheck, and tests
- create route groups for storefront, admin, and POS
- create shared Firebase client/server initialization modules using placeholders
- add Firebase emulator config
- add Firestore rules and Storage rules starter files
- add local seed strategy for emulator data
- create base design tokens from `DESIGN-SYSTEM.md`
- create shell layouts for storefront, admin, and POS
- create auth boundary placeholders
- create RBAC helper interfaces
- create commerce domain types from `DATA-MODEL.md`
- add environment validation for required variables
- document local setup

Boundaries:

- no real Firebase credentials
- no payment integration
- no production deployment
- no final catalogue
- no advanced hero animation yet

## Phase 1 - Commerce Core

Goal: implement shared data and business rules used by storefront, admin, and POS.

Status: baseline commerce core implemented. The repo now includes validation schemas, expanded commerce types, memory and Firestore repository adapters, server-side commerce operations, inventory ledger handling, order draft and sale completion operations, POS sale permission checks, idempotency handling, emulator seed data, and unit tests. Firestore rules tests pass locally with JDK 21+ available.

Tasks:

- product model
- variant model
- categories/collections
- media metadata
- customers
- orders
- payments placeholder model
- inventory ledger
- promotions model
- delivery rules model
- RBAC model
- audit log model
- validation schemas
- Firestore rules tests
- emulator seed data

Required backend/server operations:

- create/update products
- create/update variants
- adjust inventory
- create order draft
- complete order with placeholder payment
- complete POS sale with placeholder payment
- write audit logs

## Phase 2 - Admin Portal

Goal: let the client run store operations.

Status: admin portal baseline in progress. The repo now has admin routes for dashboard, products, orders, inventory, customers, promotions, content/media, delivery, reports, users/roles, settings, and audit logs. It also has a Firebase Auth admin sign-in screen at `/admin/login`, a server session-cookie bridge, a one-time owner bootstrap script, live-or-sample product catalogue loading, and authenticated product/variant create actions that use Firebase-backed server operations. Remaining create/edit/save workflows must be wired before Phase 2 is fully accepted.

Tasks:

- admin dashboard
- product CRUD
- variant CRUD
- category/collection management
- media upload and selection
- content/CMS pages
- order list and detail
- fulfilment status updates
- inventory movement view and adjustment
- customer list/detail
- promotions
- delivery settings
- reports initial views
- users and roles management
- audit log viewer
- settings
- one-time owner bootstrap flow

Verification:

- admin can upload and publish products without code changes
- low-stock products are visible
- order channel and fulfilment status are separate
- role changes are permission-checked
- initial owner custom claims and Firestore user are set only through server-side bootstrap

Current local note: product and variant creation now have admin forms and server actions, but save actions require Cloud Firestore, Firebase Auth Email/Password, owner bootstrap, and a signed-in admin session.

## Phase 3 - Staff POS

Goal: enable staff to complete in-store sales against shared inventory.

Tasks:

- POS login and route guard
- active shift flow
- product search
- category shortcuts
- variant selector
- cart
- walk-in customer flow
- customer search/create if allowed
- discounts with role limits
- payment method capture
- complete sale backend operation
- receipt view
- order/receipt lookup
- refund/void workflows
- manager approval flow
- shift close and daily summary

Verification:

- POS sale decrements shared inventory through ledger
- online inventory reflects POS sale
- staff cannot use unauthorized refund/discount/role actions
- duplicate sale submissions are idempotent

## Phase 4 - Conventional Storefront Commerce

Goal: build the complete shopping path before cinematic homepage polish.

Tasks:

- shop page
- category pages
- product detail pages
- search
- cart
- product bottom sheet
- cart drawer/bottom sheet
- checkout placeholder flow
- order confirmation
- account/order lookup if enabled
- delivery selection
- discount code
- SEO metadata

Verification:

- customer can complete a test order in emulator/local mode
- checkout is conventional and clear
- cart works on mobile
- product pages are crawlable

## Phase 5 - Cinematic Storefront

Goal: implement the Soft Spatial / Depth Gallery homepage and motion system.

Tasks:

- mobile-first hero
- scroll-scrub hero sequence
- portal transition
- spatial collection explorer
- horizontal depth carousel
- product bottom-sheet integration
- black contrast scene
- botanical depth/parallax
- micro-interactions
- reduced-motion mode
- performance tuning

Verification:

- first mobile viewport is product-led and not text-heavy
- vertical scroll can drive horizontal/spatial motion
- shopping controls remain reachable
- reduced-motion mode works
- performance is acceptable on mobile-width browser checks

## Phase 6 - Optimization And Quality

Goal: make the application robust before production.

Tasks:

- mobile performance audit
- image optimization
- accessibility pass
- SEO pass
- rules and function tests
- report performance review
- empty/error/loading states
- browser verification at mobile and desktop
- analytics event plan
- monitoring/error reporting setup

Status: accessibility, SEO, rules/function tests, and error/loading/empty states
are done — see [ACCEPTANCE-CRITERIA.md](ACCEPTANCE-CRITERIA.md) Phase 6 section
for specifics. A full mobile-performance/Lighthouse audit and a dedicated
analytics event plan were not run in this pass; Cloud Run logs currently serve
as the monitoring/error-reporting mechanism rather than a third-party APM tool.

## Phase 7 - Production Readiness

Goal: wire real services and prepare launch.

Tasks:

- Firebase production project config
- Firebase App Hosting deployment
- custom domain
- payment provider integration
- payment webhooks
- email/SMS/WhatsApp notifications
- backup/export strategy
- production security review
- admin seed owner account
- final product catalogue upload
- delivery rules
- policy text
- launch checklist

Status: production config, Cloud Run deployment, backup/export strategy
(automated daily Firestore backups), security review, owner seeding, and SMS
notifications (Arkesel) are done. See [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md)
for the full breakdown. Custom domain was explicitly skipped for now (the
Firebase-hosted URL is live). Payment provider (Paystack) is intentionally
deferred by the store owner — checkout and webhook code exist and are wired,
but live credentials haven't been supplied yet. Final catalogue upload,
taxonomy, and policy-text review are store-owner content decisions, not
engineering work.

Boundaries:

- do not test live payments without explicit approval
- do not create live customer notifications without explicit approval
- do not claim production verification from local/emulator checks

## Documentation Updates

Update docs when:

- data model changes
- permissions change
- payment provider is selected
- Firebase environment strategy changes
- storefront motion changes materially
- admin/POS workflows change
- acceptance criteria change

## Recommended First Codex Task

```text
Read AGENTS.md and all docs. Implement Phase 0 only. Use placeholders for Firebase. Do not add credentials. Create the app skeleton, Firebase-ready structure, emulator setup, base UI foundations, tests, and docs updates required by Phase 0. Stop after Phase 0 acceptance criteria pass.
```
