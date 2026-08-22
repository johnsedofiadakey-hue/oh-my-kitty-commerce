# Oh My Kitty Commerce

Firebase-first commerce platform for Oh My Kitty, a feminine hygiene and wellness brand.

This repository contains the Codex project pack plus the current implementation baseline. It is designed so Codex can continue implementation without re-interpreting the product, design, POS, admin, permissions, Firebase, and security direction from chat history.

> **For what's actually built today**, see [`docs/BUILD-LOG.md`](docs/BUILD-LOG.md) — the stack, architecture, and a feature-by-feature history grounded in the real commit log. Everything below this point (and the rest of `docs/`) is the original upfront planning spec and has drifted from current state in a number of places.

## Current Status

- Repository state: Phase 2 admin portal product workflow baseline with working local storefront shop/cart preview.
- Firebase details: real values belong in local env files or deployment secrets, not git.
- Implementation: Next.js app with Firebase-ready boundaries, storefront shop/cart, brand logo asset, admin portal data views, admin sign-in/session bridge, owner bootstrap script, product/variant create actions, rules, emulator config, Firestore repository adapter, domain types, validation schemas, RBAC helpers, inventory ledger operations, order/POS sale operations, seed data, and starter tests.
- Credentials: no real credentials should be committed.

## Product Surfaces

- Storefront: mobile-first cinematic commerce site with Soft Spatial / Depth Gallery art direction.
- Admin portal: product, content, media, orders, fulfilment, inventory, customers, promotions, delivery, reports, users, roles, and settings.
- Staff POS: in-store sales interface for admin-created staff accounts, shared inventory, RBAC, receipts, refunds/voids, shifts, and channel reporting.

## Planned Platform

- Next.js App Router with TypeScript.
- Firebase App Hosting.
- Firebase Authentication.
- Cloud Firestore.
- Firebase Storage.
- Cloud Functions or server-side Firebase endpoints for privileged operations.
- Environment variables and Firebase/App Hosting secrets for all sensitive values.

## Documentation Map

- `AGENTS.md`: rules Codex must follow.
- `docs/PRODUCT-SPEC.md`: master product specification.
- `docs/DESIGN-SYSTEM.md`: visual language and UI standards.
- `docs/MOTION-SYSTEM.md`: scroll, transition, and interaction choreography.
- `docs/STOREFRONT-UX.md`: customer storefront flows.
- `docs/ADMIN-SPEC.md`: admin portal requirements.
- `docs/POS-SPEC.md`: staff POS requirements.
- `docs/PERMISSIONS.md`: RBAC and manager approval model.
- `docs/FIREBASE-ARCHITECTURE.md`: Firebase-first technical architecture.
- `docs/DATA-MODEL.md`: Firestore collections and commerce entities.
- `docs/SECURITY.md`: auth, rules, secrets, payment, and audit strategy.
- `docs/DEVELOPMENT-PLAN.md`: phased build order.
- `docs/ACCEPTANCE-CRITERIA.md`: verification gates.
- `docs/DECISIONS.md`: locked project decisions.

## Environment Placeholders

Use `.env.example` as the template for local variables. Real values belong in:

- `.env.local` for local development only.
- Firebase App Hosting secrets or Google Cloud Secret Manager for deployed environments.
- Firebase Console configuration for Firebase project settings.
- Payment provider dashboard secrets for payment keys and webhooks.

Never commit:

- `.env.local`
- Firebase service-account JSON files
- payment secret keys
- webhook signing secrets
- private API keys

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Core checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Firebase emulator/rules check:

```bash
npm run test:rules
```

The current Firebase CLI requires JDK 21 or newer for emulator tests. If the local machine has an older Java runtime, install a newer JDK before running `npm run test:rules`.

Seed the Firestore emulator after it is running:

```bash
npm run seed:emulator
```

Seed the configured Firebase project with the starter catalogue:

```bash
SEED_FIRESTORE_CATALOG=true npm run seed:catalog
```

Only run this against a development Firebase project. It writes starter products, variants, categories, collections, promotions, delivery rules, public site settings, and a seed audit log to the Firestore project configured by your local environment.

One-time owner bootstrap:

```bash
npm run bootstrap:owner
```

Before running it, enable Cloud Firestore, enable Email/Password in Firebase Authentication, create the owner user in Firebase Auth, and add these values to `.env.local` or your shell environment:

- `BOOTSTRAP_OWNER_UID`
- `BOOTSTRAP_OWNER_EMAIL`
- `BOOTSTRAP_OWNER_DISPLAY_NAME`

The owner password is not stored in this repository or in env files. It is used only through Firebase Authentication at `/admin/login`.

Local routes:

- `/` storefront shell
- `/shop` storefront shop using live Firestore data when available
- `/cart` local cart preview
- `/admin` admin shell
- `/admin/login`
- `/admin/products`
- `/admin/orders`
- `/admin/inventory`
- `/admin/customers`
- `/admin/promotions`
- `/admin/content`
- `/admin/delivery`
- `/admin/reports`
- `/admin/users`
- `/admin/settings`
- `/admin/audit`
- `/pos` POS shell

## Brand Assets

The supplied square logo is stored at:

```text
public/brand/oh-my-kitty-logo.jpeg
```

It is currently used as a small brand mark in the storefront and admin shells. Before final launch, a transparent PNG/SVG logo and product cutouts are still recommended for the premium storefront motion work.

## Next Instruction For Codex

When implementation begins, give Codex this task:

```text
Read AGENTS.md and all docs. Review the existing Phase 0, Phase 1, and Phase 2 admin baseline. Continue Phase 2 by expanding authenticated admin workflows beyond product/variant creation into edit/archive, media upload, order fulfilment, inventory adjustment, promotions, delivery, and user/role management. Keep Firebase credentials and passwords out of git. Preserve the shared Firestore inventory/order model, RBAC boundaries, owner bootstrap flow, and server-side commerce operations.
```

## Important Product Rule

The storefront may feel unusual, cinematic, and spatial. Commerce must remain obvious:

- Add to bag is always easy to find.
- Cart is familiar.
- Checkout is conventional.
- POS is fast.
- Admin is clear.
- Inventory is shared across online, POS, and admin-created orders.
