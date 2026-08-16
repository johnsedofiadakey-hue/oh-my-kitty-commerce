# Oh My Kitty Commerce

Firebase-first commerce platform for Oh My Kitty, a feminine hygiene and wellness brand.

This repository currently contains the Phase 0 Codex project pack. It is designed so Codex can start implementation without re-interpreting the product, design, POS, admin, permissions, Firebase, and security direction from chat history.

## Current Status

- Repository state: Phase 0 documentation pack.
- Firebase details: intentionally not added yet.
- Implementation: not scaffolded yet.
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

## Phase 0 Instruction For Codex

When implementation begins, give Codex this task:

```text
Read AGENTS.md and all docs. Implement Phase 0 only from docs/DEVELOPMENT-PLAN.md. Set up the app skeleton, Firebase-ready boundaries, UI foundations, test tooling, and local emulator workflow using placeholders only. Do not add Firebase credentials. Do not start Phase 1 until Phase 0 acceptance criteria pass.
```

## Important Product Rule

The storefront may feel unusual, cinematic, and spatial. Commerce must remain obvious:

- Add to bag is always easy to find.
- Cart is familiar.
- Checkout is conventional.
- POS is fast.
- Admin is clear.
- Inventory is shared across online, POS, and admin-created orders.
