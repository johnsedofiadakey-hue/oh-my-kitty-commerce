# Product Specification

## Product Vision

Oh My Kitty is a premium mobile-first commerce platform for feminine hygiene and wellness products. The storefront should feel like a soft, cinematic product world controlled by the user's thumb. The business system behind it should be practical, accurate, secure, and easy for the client to operate.

The platform has three interfaces:

1. Customer storefront for discovery, product education, cart, and checkout.
2. Admin portal for controlling the store, inventory, orders, media, content, users, and reports.
3. Staff POS for physical-shop sales, staff transactions, receipts, refunds, and shift reporting.

## Core Principle

Creative discovery and reliable commerce must coexist.

The homepage and product discovery can be spatial, scroll-triggered, and unconventional. Product purchase, payment, checkout, fulfilment, POS, and admin workflows must be obvious, stable, and conventional.

## Brand Context

The client sells feminine hygiene and wellness products. Known product examples from planning include:

- OMK Intimate Oil
- Slippery Elm
- Infection Flusher

These examples are direction-setting only. The admin must allow the client to upload and manage the final catalogue later.

## Target Users

### Customer

- Primarily mobile shoppers.
- Browses product imagery and quickly understands product categories.
- Can add to bag from product bottom sheets or full product pages.
- Completes a familiar checkout flow.
- May use guest checkout or a customer account depending on final auth/payment decisions.

### Admin

- Business owner or authorized manager.
- Controls products, categories, variants, prices, stock, content, media, orders, fulfilment, promotions, delivery, reports, staff accounts, roles, and settings.
- Does not need developers for routine product uploads or content updates.

### Staff Member

- Account created by admin.
- Uses POS for in-store sales.
- Sees only allowed pages/actions.
- Can search products, select variants, build cart, take payment, issue receipt, and view allowed transaction history.

### Manager

- Has elevated permissions for refunds, voids, price overrides, large discounts, inventory adjustments, and staff approvals.

## Product Surfaces

### Storefront

Required:

- Mobile-first home experience.
- Scroll-scrub cinematic hero.
- Soft Spatial / Depth Gallery product presentation.
- Horizontal/spatial transitions driven mostly by vertical thumb scroll.
- Portal/mask transitions.
- Soft parallax and foreground depth.
- Product bottom sheets.
- Conventional cart and checkout.
- Search and category browsing.
- Product details with variants.
- Reduced-motion version.
- SEO-friendly product and category pages.

### Admin Portal

Required:

- Dashboard.
- Product, category, variant, and media management.
- Content/CMS controls for editable website text, images, banners, featured sections, policies, and trust content.
- Orders and fulfilment.
- Inventory and stock ledger.
- Customers.
- Promotions and discounts.
- Delivery zones, pickup, and fees.
- Reports and channel analytics.
- Users, roles, and permissions.
- Settings.
- Audit logs for privileged actions.

### POS

Required:

- Admin-created staff accounts.
- RBAC permissions.
- Shared inventory with online storefront and admin-created orders.
- Product search.
- Category shortcuts.
- Variant selection.
- Cart, quantity, discounts, tax/fees if configured.
- Payment method capture.
- Receipts.
- Refunds and voids with permission and optional manager approval.
- Shift open/close.
- Staff and channel reporting.

## Commerce Rules

- Firestore is the single source of truth.
- Online, POS, and admin-created orders must use the same product, variant, order, payment, customer, and inventory concepts.
- Sales channel is separate from order status.
- Inventory changes must be recorded through an inventory ledger.
- Privileged business operations must go through backend/server logic, not direct client writes.
- Payment webhooks must be idempotent.
- A failed payment must not decrement available inventory as a completed sale.
- Refunds and returns must create ledger entries instead of silently editing past stock.

## Sales Channels

Use explicit channel values:

- `ONLINE`
- `POS`
- `ADMIN_CREATED`

Channel reporting should allow:

- revenue by channel
- order count by channel
- best-selling products by channel
- staff sales performance
- daily POS totals
- refunds and voids by staff/channel
- stock movement history

## Order Statuses

Use status values that describe fulfilment, not sales origin:

- `DRAFT`
- `PENDING_PAYMENT`
- `PAID`
- `PROCESSING`
- `READY_FOR_PICKUP`
- `OUT_FOR_DELIVERY`
- `FULFILLED`
- `CANCELLED`
- `REFUNDED`
- `PARTIALLY_REFUNDED`

## Product Model Requirements

The catalogue must support:

- product title
- slug
- description
- minimal display copy
- category and collection membership
- product images and optional video/media
- variants such as size, pack, flavor, color, bundle, or option set
- price per variant
- SKU per variant
- inventory per variant
- product status: draft, active, archived
- featured/homepage flags
- SEO metadata
- care/usage information
- compliance-safe claims controlled by admin

## Unknowns That Should Not Block Phase 0

These can be placeholders until the client provides final details:

- Firebase project config
- final product catalogue
- final product prices
- final product images
- exact payment provider
- delivery rules and fees
- legal policy text
- claims and product-use wording approved by the client
- domain
- social links
- notification provider

## Explicit Non-Goals For Early Phases

- Do not build the cinematic homepage before the shared commerce foundation exists.
- Do not hardcode the final catalogue.
- Do not build a separate POS database.
- Do not make checkout experimental.
- Do not use unapproved health or medical claims.
- Do not commit credentials.

## Success Definition

The platform is successful when:

- customers can shop easily on mobile
- admin can run the business without developers for routine operations
- staff can sell in-store without admin-level access
- inventory stays consistent across online and POS sales
- reports distinguish sales channel, staff, stock movement, refunds, and revenue
- the storefront keeps the original cinematic visual direction without damaging speed or checkout clarity
