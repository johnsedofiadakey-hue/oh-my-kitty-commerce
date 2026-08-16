# Storefront UX Specification

## Storefront Goal

The storefront should be a mobile-first, cinematic product discovery experience that still lets customers buy quickly and confidently.

Primary viewport: 390 x 844.

## Information Architecture

Required public routes:

- Home
- Shop
- Collections/Categories
- Product detail
- Search
- Cart
- Checkout
- Account or order lookup, if customer accounts are enabled
- About/Brand story
- FAQ
- Contact
- Delivery information
- Returns/refunds policy
- Privacy policy
- Terms

The home experience can be experimental. Shop, product detail, cart, and checkout must be familiar.

## Homepage Journey

Recommended sequence:

1. Cinematic Hero
2. Portal Transition
3. Spatial Collection Explorer
4. Featured Product Experience
5. Black Contrast Scene
6. Ingredients/Natural Story
7. Best Sellers
8. Trust/Social Proof
9. Shop Entry
10. Footer

The homepage should feel like 6 to 7 connected scenes, not a stack of generic sections.

## Hero

Hero requirements:

- Full mobile viewport.
- Minimal top navigation.
- Product set is the visual focus.
- One short thought only, such as "Intimate care. Naturally."
- No benefit icon rows in the first viewport.
- No paragraph in the first viewport.
- Scroll starts the cinematic movement.
- Hero transitions directly into shopping/discovery.

Hero should support multiple products in different depth positions.

## Persistent Shopping Access

After the hero, show a subtle persistent control near the bottom of mobile:

```text
SHOP     center indicator     BAG 0
```

This should stay light, translucent, and thumb-reachable. It must not cover primary content.

## Mobile Navigation

Default:

- logo left
- bag/control right
- menu icon right or bottom control depending on layout

Menu behavior:

- full-height panel or drawer
- may slide horizontally from right
- large clear links
- product imagery can be used as visual support
- close button and escape/back behavior

Navigation links:

- Shop
- Collections
- About
- FAQ
- Contact
- Account/Orders if enabled

## Product Discovery

Use two discovery modes:

1. Cinematic discovery for the homepage.
2. Conventional browsing for shoppers who want direct access.

Cinematic discovery:

- spatial carousel
- product frames
- horizontal/spatial movement
- selected product large and centered
- neighboring product peeking
- quick Add to bag
- tap opens product bottom sheet

Conventional browsing:

- filters
- category chips
- sort
- product grid/list
- clear price and variant availability

## Product Bottom Sheet

Tap product from a cinematic scene to open a bottom sheet.

Required content:

- product name
- short format/variant summary
- rating or trust marker if available
- price
- selected variant
- quantity
- Add to bag
- View full details

Optional content:

- short benefit chips
- ingredient highlights
- stock indicator

The product should remain visually present above the sheet where possible.

## Product Detail Page

Required:

- title
- gallery
- price
- variant selector
- quantity
- Add to bag
- description
- usage/care instructions
- ingredients or composition where applicable
- delivery/returns notes
- related products
- SEO metadata

Variant selection should be visual when practical, but still accessible as normal form controls.

## Variant UX

Use visual variant selectors instead of a default dropdown when there are few options.

Examples:

- size tabs
- pack/quantity segmented control
- product media changes per variant
- price rolls/updates clearly
- unavailable variant is disabled with explanation

Never hide price impact.

## Cart

Mobile cart should behave as a bottom sheet or drawer before checkout.

Required:

- line items
- variant names
- quantity controls
- remove action
- subtotal
- discount entry
- delivery estimate if configured
- checkout button
- continue shopping action

Cart state must be recoverable where possible.

## Checkout

Checkout must be conventional.

Required steps:

1. Contact/customer details.
2. Delivery or pickup.
3. Payment.
4. Review.
5. Confirmation.

Allow guest checkout unless a later decision requires customer accounts.

Checkout requirements:

- no forced cinematic animation
- clear validation
- clear delivery fees
- clear payment status
- order confirmation page
- receipt or email notification once provider is configured

## Search

Search should support:

- product name
- category
- tags
- SKU/admin use optional
- quick results
- no-results suggestions

On mobile, search can be a full-screen overlay.

## Trust And Content

The site needs enough trust without becoming text-heavy.

Use:

- short claims approved by client
- product reviews/testimonials if available
- delivery/payment trust markers
- FAQ and policy routes
- natural/botanical ingredient cues

Avoid:

- medical claims without approval
- long educational blocks in primary cinematic scenes

## Accessibility And SEO

Even with animation:

- use semantic headings
- product/category pages must be crawlable
- product structured data should be planned
- images need alt text
- links and buttons must be keyboard usable
- reduced-motion users must get a stable path

## Storefront Acceptance Notes

The storefront is not acceptable if:

- first mobile viewport is text-heavy
- products are not the visual focus
- Add to bag is hard to find
- checkout is unusual or confusing
- animations prevent shopping
- reduced-motion mode feels broken
- desktop looks good but mobile feels secondary
