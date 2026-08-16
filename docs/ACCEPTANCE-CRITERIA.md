# Acceptance Criteria

## Global Criteria

Every phase must satisfy:

- no real credentials committed
- relevant docs followed or updated
- typecheck passes
- tests pass where available
- lint/format checks pass where available
- Firestore/Storage rules tests pass for security-sensitive work
- mobile viewport verified for storefront UI changes
- admin/POS workflows verified for permission boundaries
- final report separates local, emulator, deployed, and live verification

## Phase 0 Acceptance

Phase 0 is complete only when:

- app scaffold exists
- `AGENTS.md` and docs remain present and linked from README
- `.env.example` has placeholders only
- real credentials are absent from git
- Firebase initialization safely handles missing real config
- emulator config exists or local emulator setup is documented
- route groups/shells exist for storefront, admin, and POS
- base design tokens reflect white, peach-pink, near-black, and botanical green
- RBAC and commerce types/interfaces are started
- local commands are documented
- tests/typecheck/lint/build pass if configured

Current local note: lint, typecheck, unit tests, and production build pass in the scaffold. Firestore rules tests are configured through `npm run test:rules`, but the local machine must have JDK 21 or newer for the current Firebase CLI emulator.

## Phase 1 Acceptance

Commerce core is acceptable when:

- product, variant, category, collection, customer, order, payment, promotion, and inventory models exist
- inventory movements are ledgered
- order channel is separate from order status
- validation exists for create/update operations
- emulator seed data covers online, admin, and POS examples
- backend/server operations enforce privileged writes
- security rules block unsafe public writes
- audit logs are created for privileged operations

Current local note: commerce unit tests cover product/variant creation, inventory adjustment, POS sale completion, online sale completion, idempotency, discount permission failure, draft order behavior, channel/status separation, and audit logging. Firestore rules tests are still blocked locally by the JDK 21 requirement for Firebase CLI emulators.

## Phase 2 Acceptance

Admin is acceptable when:

- admin can create/edit/archive products
- admin can create/edit variants and prices
- admin can upload/select media
- admin can manage CMS content
- admin can view orders by channel/status
- admin can update fulfilment status
- admin can view and adjust inventory with ledger entries
- admin can view customers with permission controls
- admin can manage promotions and delivery settings
- admin can create/deactivate staff users through backend logic
- admin can assign roles/permissions
- initial owner account can be bootstrapped through Firebase Admin without storing a password
- reports show at least revenue, order count, channel split, low stock, and POS totals
- audit logs record privileged actions

Current local note: baseline admin views exist for all required sections and render from shared commerce data. The repo also has a Firebase Auth admin sign-in screen, server session bridge, owner bootstrap script, and authenticated product/variant create actions. Phase 2 is not fully accepted until remaining edit/save workflows are wired to Firebase-backed server operations.

## Phase 3 Acceptance

POS is acceptable when:

- staff can log in with admin-created account
- role guard blocks unauthorized staff
- staff can open/close shift if shift policy is active
- staff can search products
- staff can select variants
- staff can build cart
- staff can complete POS sale
- backend decrements shared inventory through ledger
- receipt is generated
- cash payment can calculate change
- discounts obey role limits
- refunds/voids require permission and manager approval when configured
- duplicate submissions are idempotent
- admin reports can separate POS from online sales

## Phase 4 Acceptance

Conventional storefront commerce is acceptable when:

- shop page works on mobile
- category pages work
- product detail page shows variant, price, Add to bag, and product details
- product bottom sheet works
- cart drawer/bottom sheet works
- checkout flow is clear and conventional
- test order can be completed in local/emulator mode
- product and category pages have SEO metadata
- reduced-motion users can shop without blocked interactions

## Phase 5 Acceptance

Cinematic storefront is acceptable when:

- first mobile viewport is product-led and minimal text
- hero supports multiple featured products
- scroll-scrub hero works or has a documented fallback
- vertical scroll drives at least one horizontal/spatial transition
- portal or mask transition is implemented
- soft parallax is used without hurting core shopping
- product bottom sheets remain reachable
- Add to bag is not hidden by motion
- black contrast scene uses near-black intentionally
- botanical green remains restrained
- reduced-motion mode is tested
- mobile performance is checked in browser

## Phase 6 Acceptance

Optimization is acceptable when:

- images are responsive and optimized
- initial mobile load is reviewed
- animation assets are lazy/preloaded appropriately
- accessibility checks pass for core flows
- SEO basics are present
- error/loading/empty states exist
- rules tests cover sensitive collections
- admin and POS are usable at mobile/tablet/desktop widths where required

## Phase 7 Acceptance

Production readiness is acceptable when:

- Firebase project values are configured through secrets/env, not git
- production deployment succeeds
- domain and SSL are configured if domain is available
- payment provider is integrated and webhook verification passes in a safe test mode
- notification provider is integrated only with approved credentials
- backup/export plan exists
- owner/admin seed process is secure
- final product catalogue can be uploaded from admin
- launch checklist is complete

## Storefront Rejection Conditions

Reject storefront work if:

- mobile is treated as secondary
- hero is text-heavy
- products are small in the first viewport
- product purchase path is confusing
- checkout is experimental
- animations delay add-to-cart or checkout
- reduced-motion mode is absent

## Admin Rejection Conditions

Reject admin work if:

- the client must edit code for routine content/product changes
- roles are hardcoded only in UI
- order fulfilment cannot be updated
- inventory has no movement history
- reports cannot distinguish online and POS channels

## POS Rejection Conditions

Reject POS work if:

- POS has separate inventory
- staff can bypass role limits
- sale completion is direct client Firestore writes only
- refunds/voids have no audit trail
- receipts are missing
- shift cash cannot be reconciled
