# POS Specification

## POS Goal

The POS lets staff complete in-store sales quickly while using the same catalogue, inventory, customer, order, payment, and reporting systems as the online storefront.

In this project, "offline sales" means physical-shop or staff-entered sales, not necessarily sales that can complete without internet. True offline-first sync can be considered later, but Phase 0 to Phase 3 should assume server confirmation is required to complete a sale and reserve stock safely.

## POS Users

Staff accounts are created by admin. Staff do not self-register for POS access.

Possible POS users:

- Cashier
- Sales Staff
- Store Manager
- Owner/Admin

The UI must only show allowed features, but backend permission checks are still required.

## POS Devices

Support:

- phone
- tablet
- laptop/desktop

Preferred fastest cashier experience:

- tablet or laptop/desktop

Phone must remain usable.

## POS Navigation

Required areas:

- Sell
- Orders/Receipts
- Customers, if permission allows
- Returns/Refunds, if permission allows
- Shifts
- Daily Summary
- Settings limited by role

## Sale Workflow

1. Staff logs in.
2. Staff opens active shift if required.
3. Staff searches or browses products.
4. Staff selects product and variant.
5. Staff adds item to cart.
6. Staff adjusts quantity.
7. Staff optionally attaches customer or uses walk-in customer.
8. Staff applies discount if permission allows.
9. Staff selects payment method.
10. Backend validates price, stock, discount, role, and shift.
11. Order is created with channel `POS`.
12. Inventory ledger records stock movement.
13. Receipt is generated.
14. POS returns to new sale state.

## Product Search

Search by:

- product name
- SKU
- barcode if available
- category
- tag

Search must be fast and support touch input.

## Product Browse

Required:

- category shortcuts
- product grid/list
- stock indicator
- variant selector
- price
- disabled state for unavailable products

The POS product UI can be plain and fast. It does not need the cinematic storefront design.

## Cart

Cart must show:

- product name
- variant
- quantity
- unit price
- discount
- line total
- remove action
- subtotal
- total
- payment due

Optional:

- tax line if configured
- delivery/pickup line if admin-created sale uses fulfilment

## Discounts And Price Overrides

Discount rules:

- Staff can apply only discounts allowed by role.
- Role can define maximum discount percent or amount.
- Large discounts require manager approval.
- Price override requires explicit permission.
- Every discount/override records actor and reason.

## Payments

Initial payment methods can be placeholders until provider decision:

- cash
- mobile money
- card
- manual transfer
- other

POS must record:

- payment method
- amount paid
- change due for cash
- reference number when available
- provider status when integrated
- staff actor

Split payment can be a later enhancement unless required before launch.

## Receipts

Receipt must include:

- store name
- order number
- date/time
- staff name or staff id
- items and variants
- quantities
- totals
- payment method
- customer if attached
- refund/return policy snippet if configured

Receipt delivery options:

- on-screen receipt
- print-ready view
- email/SMS later when notification provider is configured

## Refunds, Returns, And Voids

Definitions:

- Void: cancel a POS transaction before it is finalized or settled.
- Refund: return money after payment is completed.
- Return: product is returned to inventory if eligible.

Rules:

- Refunds require permission.
- Voids require permission.
- Manager approval can be required for refunds, voids, price overrides, and large discounts.
- Return-to-stock creates an inventory ledger entry.
- Damaged returns do not increase sellable stock.
- Refunds should update order/payment records, not delete the original order.

## Manager Approval

Approval flow:

1. Staff starts restricted action.
2. POS shows approval request.
3. Manager authenticates or approves from own session.
4. Backend verifies manager permission.
5. Action is completed and audit log is written.

Approval record should include:

- requested by
- approved by
- action type
- reason
- order id
- amount/discount when relevant
- created at

## Shift Management

Required if cash sales are supported:

- open shift
- opening cash amount
- cash sales
- non-cash sales
- refunds
- cash expected
- closing cash count
- difference
- shift notes
- close shift

Reports:

- daily POS summary
- sales by staff
- refunds/voids by staff
- channel totals

## POS Inventory Behavior

When completing a POS sale:

- backend validates current stock
- backend creates order
- backend records payment
- backend writes inventory movement
- backend updates product/variant stock projection if used

Do not decrement stock from client code alone.

## Network Handling

For early phases:

- POS can keep an in-progress cart locally.
- A sale is not complete until the backend confirms it.
- If network fails during completion, POS must show pending/unknown state and prevent duplicate submissions.
- Use idempotency keys for sale completion.

True offline sale queues require a later explicit design because they can oversell inventory.

## POS Reporting

Required:

- daily sales total
- cash total
- non-cash total
- sales by staff
- refund total
- void total
- best-selling POS products
- POS vs online channel comparison in admin reports

## POS Acceptance Notes

POS is not acceptable if:

- staff need admin privileges to sell
- POS has separate stock from online storefront
- staff can bypass discount/refund permissions
- sale completion happens only through client-side writes
- receipts are missing
- shifts cannot reconcile cash
- duplicate sale submissions can create duplicate orders
