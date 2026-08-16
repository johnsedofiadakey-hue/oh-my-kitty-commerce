# Admin Portal Specification

## Admin Goal

The admin portal lets the client run the store without developer support for routine operations. It should be fast, clear, secure, and permission-aware.

Admin is not a cinematic interface. It should prioritize accuracy, speed, and operational control.

## Admin Users

Admin users are authenticated through Firebase Authentication and authorized through RBAC.

Admin roles may include:

- Owner
- Admin
- Manager
- Fulfilment Staff
- Inventory Staff
- Marketing/Content Staff
- Support Staff

Roles are examples. The system must support custom roles.

## Admin Sections

Required navigation:

- Dashboard
- Products
- Categories/Collections
- Media
- Content/CMS
- Orders
- Fulfilment
- Inventory
- Customers
- Promotions
- Delivery
- Reports
- POS/Shifts
- Users/Roles
- Settings
- Audit Logs

## Dashboard

Show:

- total revenue
- order count
- pending orders
- low stock products
- POS sales today
- online sales today
- best-selling products
- recent orders
- fulfilment alerts
- refunds/voids requiring review

Dashboard metrics must identify whether they are live, cached, or generated from report projections.

## Product Management

Admin must support:

- create product
- edit product
- archive product
- duplicate product
- publish/unpublish product
- manage product images/video
- assign category/collection
- assign tags
- set short display copy
- set long description
- set usage/care info
- set ingredients/composition
- set SEO title/description
- configure featured/homepage flags

Product status:

- `DRAFT`
- `ACTIVE`
- `ARCHIVED`

Archived products should not be deleted if they are referenced by historical orders.

## Variant Management

Variants must support:

- SKU
- barcode optional
- title/option values
- price
- compare-at price optional
- cost optional
- inventory tracking flag
- media override optional
- active/inactive
- low-stock threshold

Examples:

- 30 capsules
- 60 capsules
- bundle
- size options
- product format options

## Category And Collection Management

Support:

- categories
- featured collections
- homepage collection groups
- sort order
- category images
- SEO metadata
- active/inactive state

## Media Management

Admin can upload and manage:

- product photos
- transparent product cutouts
- homepage hero media
- banners
- product videos
- mobile-specific assets
- reduced-motion fallback images

Media fields:

- file URL
- storage path
- alt text
- title
- tags
- usage context
- uploaded by
- created at

Media uploads go to Firebase Storage and are referenced from Firestore.

## Content/CMS

Admin must control editable site content without controlling animation structure.

Editable content:

- homepage small copy
- hero microcopy
- featured product labels
- collection names/descriptions
- trust markers
- FAQ
- about page
- contact details
- delivery text
- return/refund text
- policy pages
- social links
- announcement bar

Non-editable by CMS unless specifically built later:

- core motion choreography
- page routing
- checkout logic
- POS logic
- security rules
- payment flow

## Orders

Admin orders view must support:

- list orders
- filter by status
- filter by channel
- filter by payment status
- filter by fulfilment status
- search by customer, order number, phone, email
- view order details
- update fulfilment status
- add internal notes
- cancel if allowed
- initiate refund if allowed
- print/download receipt or invoice

Order detail must show:

- customer
- channel
- items and variants
- inventory effects
- payment status
- fulfilment timeline
- notes
- audit trail

## Fulfilment

Support:

- pickup
- local delivery
- nationwide delivery if configured
- fulfilment statuses
- tracking/reference fields
- delivery fee calculation from delivery rules
- packing notes
- fulfilment staff assignment optional

## Inventory

Inventory must be ledger-based.

Admin can:

- view stock by product/variant
- view low-stock alerts
- receive stock
- adjust stock with reason
- mark damaged/lost stock
- view stock movement history
- export movement history

Inventory adjustment requires permission and audit logging.

## Customers

Admin can:

- view customer profiles
- search customers
- view order history
- edit contact details if allowed
- create customer from POS/admin if allowed
- merge duplicates later if implemented
- add customer notes if allowed

PII must be protected by permissions and security rules.

## Promotions

Support:

- discount codes
- automatic discounts
- channel-specific discounts
- date ranges
- usage limits
- minimum order value
- product/category restrictions
- staff discount limits for POS

Discounts over configured thresholds require elevated permission or manager approval.

## Delivery

Admin can manage:

- pickup option
- delivery zones
- delivery fees
- free delivery thresholds
- delivery notes
- enabled/disabled regions
- estimated delivery text

Exact Ghana delivery rules are TBD and should remain configurable.

## Reports

Required reports:

- revenue summary
- orders by status
- sales by channel
- POS daily totals
- sales by staff
- best-selling products
- inventory movement
- low-stock report
- refunds and voids
- discount usage

Reports can initially be generated from Firestore queries. For scale, add scheduled report projections later.

## Users And Roles

Admin can:

- invite/create staff users
- assign role
- deactivate user
- reset role
- set POS access
- set page/action permissions
- view audit activity

Privileged user creation must go through backend logic, not direct client writes.

## Settings

Settings include:

- store name
- domain/site URL
- currency
- tax behavior if needed
- payment provider settings placeholders
- receipt settings
- order numbering
- inventory policy
- POS settings
- notification settings
- legal policy links

Secrets are not stored directly in editable settings documents.

## Audit Logs

Log:

- role changes
- user creation/deactivation
- product publish/archive
- price changes
- inventory adjustments
- refunds
- voids
- manager approvals
- settings changes
- payment webhook outcomes

Audit logs should include:

- actor user id
- actor role at time
- action
- entity type/id
- before/after summary where safe
- reason
- created at

## Admin Acceptance Notes

Admin is not acceptable if:

- the client must edit code to upload products
- staff users require Firebase Console access
- role changes can be made client-side without backend validation
- inventory is edited as a naked number without a movement log
- order status and sales channel are mixed together
- reports cannot separate POS and online sales
