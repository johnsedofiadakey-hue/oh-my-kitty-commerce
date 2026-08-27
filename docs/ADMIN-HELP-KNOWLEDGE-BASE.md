# Admin Help Knowledge Base

This is the grounding content for the admin portal's AI help widget. It is written as direct, task-oriented answers ("how do I…") to real questions a staff member would ask, describing the actual current admin UI — not aspirational or planned features. If something a user asks about isn't covered here, the AI is instructed to say so rather than guess.

Every admin page lives under **Settings icon → sidebar** on the left. The sidebar groups are: Catalog, Sales, Operations, Insights, Admin. Your own name and role show at the bottom of the sidebar — click it to reach **My Account**.

---

## Signing in and your account

**How do I sign in?** Go to `/admin/login`, enter your email and password. "Forgot password?" on that page sends a reset link to your email — only works if you're signed out.

**How do I change my password?** Click your name at the bottom of the sidebar to open **My Account**. Enter your current password, then a new password (at least 8 characters, must be different from your current one), confirm it, and submit. This signs you out of every other device/browser automatically — you stay signed in on the tab you did this from.

**I can't change my email.** Correct — there's currently no way to change your own email address in the admin. Ask an Owner to update it, or contact support.

**Can I see my role?** Yes, it's shown right under your name at the bottom of the sidebar (Owner, Manager, Sales Staff, or a custom role name).

---

## Roles and what each can do

There are three built-in roles, plus the ability to create custom ones:

- **Owner** — full access to everything, including Settings, Users & roles, and Delivery. Only Owners can create/edit/delete custom roles and other staff accounts' status.
- **Manager** — can do almost everything day-to-day (orders, inventory, customers, promotions, reports, POS with refund/void), but cannot access Settings, Delivery, or Users & roles.
- **Sales Staff** — POS-only. Can sell, view products/orders/customers, open/close their own shift, view receipts. No refund/void ability, no discount ability, cannot access the admin portal pages at all (only POS).

**How do I create a custom role?** Go to **Users & roles** (Owner only). There's a role editor with a grouped permission checklist — tick exactly the permissions the new role should have, name it, save. Built-in roles (Owner/Manager/Sales Staff) can't be edited or deleted. A custom role can't be deleted while any staff account is still assigned to it — reassign them first.

**How do I give someone POS access?** Edit their account on **Users & roles** and toggle "Can use POS" on — this is separate from their role.

---

## Staff accounts

**How do I add a new staff member?** Go to **Users & roles** (Owner only) → invite/add staff. You set their email and a password directly (they sign in with what you give them — there's no email invite link). Assign a role and, if they'll use POS, enable "Can use POS."

**How do I remove someone's access?** On **Users & roles**, change their status to deactivated, or change their role to something more limited. There's no way to fully delete a staff account from the UI currently — deactivating is the way to cut off access.

---

## Products & Categories

**How do I add a new product?** Go to **Products** → add product. Fill in title, description, category, price. Each product has at least one variant (the sellable unit with its own price/SKU/stock).

**How do I upload a product photo?** Open the product's edit drawer on **Products**, use the image upload field — pick a file from your device (there's no way to paste an image URL, only a real file upload). It gets compressed automatically before uploading.

**How do I put a product on sale (show a strikethrough price)?** In the product edit drawer, there's a "Was price" field — set it higher than the current price and a strikethrough "was" price shows automatically on the storefront. Leave it blank for no sale. If you set it lower than or equal to the real price, nothing shows (that's intentional — it won't display a fake sale).

**How do I control where a product appears / its order on the shop page?** There's a "shop position" field in the product edit drawer for manually ordering the grid.

**How do I manage categories?** Go to **Categories** — create, quick-edit, toggle active/inactive, and upload a category photo. If a category has no photo, it falls back to showing a photo from one of its products.

**What's Taxonomy?** A separate page for managing shared classification lists product forms pull from (like product types, concerns, routines) — not something you'd normally touch unless setting up a new kind of grouping.

---

## Orders

**Where do I see new orders?** **Orders** page — split into a numbered "Needs attention" queue (oldest first) and a collapsed "Completed" section. Click a row to expand full detail (customer info, delivery info, itemized photos, totals).

**How do I update an order's status?** Use the inline status dropdown directly on the row in the "Needs attention" queue, or open the row's detail drawer for the same control with more context.

**How do I refund or void an order?** Open the order in **Orders** (or from POS if it was a POS sale). Refund/void requires the `orders.refund`/`orders.void` permission — Owners and Managers have it by default, Sales Staff don't. If the refund/void amount is over the acting staff member's role limit, it requires manager approval — the approving manager enters their own credentials to confirm, verified server-side.

**A customer says they paid but I don't see their order.** Ask for their order number or phone number and check **Orders**. If it's a real Paystack payment, it should appear as soon as payment is confirmed. If it genuinely isn't there despite a real successful payment, that's unusual — flag it to an Owner rather than guess.

---

## Inventory

**How do I adjust stock?** Go to **Inventory**, click a row to open its drawer — there's an adjustment form (add/remove stock with a reason) and that variant's own movement history right there.

**What's "low stock"?** Each product variant has its own low-stock threshold; the Inventory page and Dashboard both flag anything at or below that threshold.

**Can stock go negative?** Yes, deliberately — if a customer pays online or via POS mobile money before you notice stock ran out, the payment is still honored and confirmed (a customer who already paid shouldn't be told "sorry" over a stock number) and inventory shows negative as a visible signal that item is oversold and needs urgent restocking.

---

## Customers

**Where do I see customer info?** **Customers** page — view, create, and update customer records. Full contact details (PII) require the `customers.view_pii` permission.

---

## Promotions / discount codes

**How do I create a discount code?** Go to **Promotions** → create. Set the code, whether it's a percentage or fixed amount off, an active date range, a usage limit, and optionally restrict it to specific products/categories or sales channels (online/POS).

**Does a promo code actually work at checkout?** Yes — customers enter it at checkout and see a live discount preview before paying; it's re-validated for real when they actually pay. At POS, staff can apply one too (requires the `pos.discount` permission).

**What does "requires manager approval" mean on a promotion?** If checked, only a staff member whose role already grants `pos.price_override` (Owners/Managers by default) can apply that code at POS — regular Sales Staff can't self-approve it.

**Does a code's usage count go up immediately when someone enters it?** No — only once the order is genuinely confirmed/paid, not just when someone types the code in at checkout.

---

## Content & Media

**How do I change the WhatsApp number, pickup location, or other site text?** Go to **Content & Media** → "Site content" section — every editable field there (WhatsApp number, pickup location/map link, SMS message templates, shop-open/closed status and message) takes effect on the live site immediately after saving.

**How do I temporarily stop the site from taking new orders?** On **Content & Media**, under Site content, set "Shop status" to Closed and optionally customize the message shown to visitors. This pauses new online orders only — admin, POS, and order tracking keep working normally for staff. Changes can take up to about 30 seconds to apply everywhere. Set it back to Open when you're ready to resume.

**How do I upload a general image (not tied to a product)?** Content & Media has an "Upload an image" section for one-off assets not attached to any product or category — upload from your device, get a usable image URL back. You can delete any uploaded image from the Media library list below it, unless it's still being used by a live product or category (deletion is blocked in that case to avoid breaking that listing).

---

## Delivery

**How do I set delivery zones/fees?** **Delivery** page (Owner only) — manage delivery rules and pricing customers see at checkout.

---

## Reports & Dashboard

**What's the difference between Dashboard and Reports?** Dashboard is your daily at-a-glance view (unfulfilled orders, low stock, channel totals — what needs a decision right now). Reports covers what Dashboard doesn't: discount usage and top products by revenue.

**What's the Audit log?** A record of privileged actions — product/order/inventory/user/role changes and POS activity — with who did what and when. Useful for tracing "who changed this."

---

## POS (point of sale)

**How do I start selling at POS?** POS is a separate screen from the admin portal (staff with "Can use POS" enabled reach it even without full admin access). You open a shift first (**pos.shift.open**), then can ring up sales; close the shift when done.

**What payment methods does POS support?** Cash, Card (staff attestation — you already have a separate card terminal, this just records it), Manual transfer (staff attestation), and Mobile Money — Mobile Money is a **real** charge: selecting it sends the customer's phone a real payment prompt, and the sale only completes once that payment is actually confirmed. POS works offline for cash/card/manual and queues sales to sync when the connection returns; mobile money needs a live connection.

**Can Sales Staff give a discount or refund at POS?** No — Sales Staff have a 0% discount limit and 0 refund limit by default. Only Managers and Owners (or a custom role granted those permissions) can.

---

## Settings

**What's on the Settings page?** Store name, receipt footer text, and a read-only list of recent POS shifts. Owner only.

---

## If something seems broken

If a payment, order, or number genuinely looks wrong and none of the above explains it, don't guess at a fix — flag it to an Owner with the specific order number or details so it can be looked into properly.
