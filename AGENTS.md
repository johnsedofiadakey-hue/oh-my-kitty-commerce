# AGENTS.md

This repository is the source of truth for the Oh My Kitty commerce build. Codex agents must read this file before making changes.

## Product Summary

Oh My Kitty is a Firebase-first commerce platform for a feminine hygiene and wellness brand. The product has three primary interfaces:

1. Customer storefront: mobile-first, cinematic, highly visual, and commerce-safe.
2. Admin portal: practical business control for the client.
3. Staff POS: fast in-store sales with admin-created staff accounts and role-based access control.

The storefront is intentionally expressive. The admin and POS are intentionally conventional and efficient.

## Non-Negotiable Direction

- Mobile is the primary storefront experience. Design around a 390 x 844 viewport first.
- Expect most customers to shop on phones.
- Storefront copy must stay minimal. Product, motion, imagery, and interaction do the communication.
- Use the Soft Spatial / Depth Gallery direction.
- Preserve the palette: warm white, peach-pink, near-black, and restrained botanical green.
- Use conventional cart and checkout patterns even when discovery is cinematic.
- POS and online sales must share one inventory and order system.
- Firebase is the default platform: Firebase App Hosting, Authentication, Firestore, Storage, and Cloud Functions.
- Do not commit Firebase credentials, service-account keys, payment secrets, or private API keys.
- Use environment variable placeholders and Firebase/App Hosting secrets for sensitive values.

## Required Reading Order

Before implementation work, read:

1. `README.md`
2. `docs/OMK-DESIGN-BIBLE.md` — authoritative visual/motion/interaction spec; read before touching any storefront UI
3. `docs/PRODUCT-SPEC.md`
4. `docs/DECISIONS.md`
5. `docs/DEVELOPMENT-PLAN.md`
6. The spec file for the surface being changed
7. `docs/FIREBASE-ARCHITECTURE.md`, `docs/DATA-MODEL.md`, `docs/PERMISSIONS.md`, and `docs/SECURITY.md` before data/auth work

## Build Discipline

- Start with Phase 0 only unless explicitly instructed otherwise.
- Do not reinterpret the design from scratch. Implement the documented direction.
- Prefer TypeScript, explicit validation, and server-enforced commerce operations.
- Keep storefront, admin, POS, and shared commerce logic separated by clear module boundaries.
- Do not create a separate POS inventory database.
- Do not allow client-only writes for privileged operations such as sale completion, stock adjustment, refunds, role changes, or admin user creation.
- Add tests around shared commerce rules before relying on UI behavior.
- Update relevant docs when a major product, architecture, or security decision changes.

## Target Architecture Assumption

Unless a later decision replaces this, implement as:

- Next.js App Router with TypeScript.
- Firebase App Hosting for the web application.
- Firebase Authentication for admin, staff, and optional customer identities.
- Firestore as the single source of truth.
- Firebase Storage for media.
- Cloud Functions or server-side Firebase callable/HTTPS endpoints for privileged business operations.
- Security rules plus backend validation. Rules are not a substitute for business validation.

## UI Standards

Storefront:

- One main thought per viewport.
- Product imagery should dominate the first screen.
- Use depth, masking, portals, horizontal/spatial motion, bottom sheets, and soft parallax.
- Avoid ordinary stacked marketing sections as the main homepage language.
- Always provide reduced-motion fallbacks.
- Never make checkout experimental.

Admin and POS:

- Fast, clear, data-dense enough for daily use.
- No cinematic effects that slow down work.
- Use familiar tables, filters, drawers, dialogs, forms, receipts, and confirmations.
- Enforce permissions in both UI and backend.

## Data Safety

- Inventory changes must be ledgered.
- Orders must record sales channel separately from order status.
- Privileged actions must write audit logs.
- Payment webhooks must be idempotent.
- Refunds, voids, large discounts, and price overrides must support permission checks and manager approval.
- Avoid destructive data migrations. If required, document the migration and rollback plan before implementation.

## Completion Standard

A task is not complete until:

- The relevant docs were followed or updated.
- Typecheck, tests, lint, and build pass where available.
- User-facing UI changes are checked in browser at mobile and desktop widths.
- Security-sensitive changes include rule/function tests or a documented verification path.
- The final response clearly separates local verification, emulator verification, deployed verification, and untested live behavior.
