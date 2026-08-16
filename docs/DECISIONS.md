# Decisions

This file records project decisions that future Codex sessions should preserve unless the owner explicitly changes direction.

## ADR-001 - Mobile Is The Primary Storefront

Status: Accepted

The storefront is designed mobile-first around a 390 x 844 reference viewport. Desktop adapts the mobile experience rather than defining it.

## ADR-002 - Storefront Uses Soft Spatial / Depth Gallery Direction

Status: Accepted

The chosen visual direction is not a literal heavy 3D/WebGL world. It should feel spatial through depth, layered products, masks, portals, perspective, parallax, and scroll-controlled camera movement.

## ADR-003 - Storefront Copy Is Minimal

Status: Accepted

The first mobile viewport must not be text-heavy. One main thought per viewport is the rule. Product, motion, and imagery communicate most of the experience.

## ADR-004 - Palette Is Locked To Client Colors

Status: Accepted

Use warm white, peach-pink, near-black, and restrained botanical green. Do not add a fifth major color without documenting a new decision.

## ADR-005 - Homepage Can Be Experimental, Checkout Cannot

Status: Accepted

Discovery can use scroll-scrub, horizontal/spatial transitions, portals, masks, and cinematic motion. Cart and checkout must remain familiar and conventional.

## ADR-006 - Firebase First

Status: Accepted

The platform should be Firebase-first: Firebase App Hosting, Authentication, Firestore, Storage, and Cloud Functions/server logic. Firebase details must be supplied through local environment files or deployed secrets, never hardcoded into source.

## ADR-007 - No Credentials In Git

Status: Accepted

Firebase credentials, service-account keys, payment secrets, webhook secrets, private API keys, and account passwords must not be committed.

## ADR-008 - Firestore Is The Single Source Of Truth

Status: Accepted

Storefront, admin, and POS all share Firestore-backed commerce data. No separate POS inventory or order database.

## ADR-009 - Sales Channel Is Separate From Order Status

Status: Accepted

An order can come from `ONLINE`, `POS`, or `ADMIN_CREATED`. That does not replace fulfilment/payment/order status.

## ADR-010 - Inventory Is Ledgered

Status: Accepted

Inventory changes must be recorded as movements. Do not silently edit stock without an inventory ledger entry and audit context.

## ADR-011 - POS Staff Accounts Are Admin-Created

Status: Accepted

Staff should not self-register for POS access. Admin creates/deactivates staff and assigns roles.

## ADR-012 - RBAC Controls Staff And Admin Access

Status: Accepted

Permissions are role-based and enforced beyond UI. Admin can grant staff specific access to selected pages/actions.

## ADR-013 - Manager Approval Is Required For Restricted POS Actions

Status: Accepted

Refunds, voids, price overrides, and large discounts can require manager approval depending on role/limits.

## ADR-014 - Admin Controls Business Content

Status: Accepted

The client must be able to manage products, content, media, orders, fulfilment, inventory, customers, promotions, delivery, reports, users, roles, and settings from admin.

## ADR-015 - CMS Does Not Control Core Motion Structure

Status: Accepted

Admin can edit copy/media/sections designed for editing. CMS should not expose core animation choreography, checkout logic, POS logic, or security behavior.

## ADR-016 - Motion Must Degrade Gracefully

Status: Accepted

Reduced-motion and lower-powered mobile users must still get a beautiful and usable storefront.

## ADR-017 - Heavy WebGL Is Not The Default

Status: Accepted

Use optimized frame sequences, layered DOM/CSS transforms, and scroll animation first. Add Three.js/WebGL only if a later decision proves it is needed and performance is verified.

## ADR-018 - Build Order Is Phased

Status: Accepted

Start with Phase 0 architecture, then commerce core, admin, POS, conventional storefront commerce, cinematic storefront, optimization, and production readiness.

## ADR-019 - Product Packaging Must Stay Recognizable

Status: Accepted

The site can make the environment premium and cinematic, but it must not materially redesign real product packaging.

## ADR-020 - Product Catalogue Can Be Added Later

Status: Accepted

The final full catalogue is not required to start. Admin must support product uploads and edits so the client can add the remaining catalogue later.
