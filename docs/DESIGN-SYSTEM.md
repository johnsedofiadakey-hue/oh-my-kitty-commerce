# Design System

## Design Direction

The storefront direction is Soft Spatial / Depth Gallery. It should feel soft, warm, premium, feminine, natural, immersive, and minimal.

The site should not feel like a generic Shopify theme, a SaaS landing page, a clinical pharmacy site, or a loud pink cosmetics template.

## Palette

Use the client's four-color direction:

- Warm white: primary canvas, 60 to 65 percent.
- Peach-pink: emotional brand color, 20 to 25 percent.
- Near-black: text and high-contrast editorial scenes, 10 to 15 percent.
- Botanical green: small natural accent, 3 to 5 percent.

Suggested starting tokens:

```text
--color-white: #fffaf7
--color-white-pure: #ffffff
--color-peach: #f6b8ae
--color-peach-light: #fbe1db
--color-peach-mist: #fff3ef
--color-near-black: #111111
--color-soft-black: #1b1716
--color-green: #50683f
--color-green-soft: #7f936d
--color-line: #ead9d2
```

Do not introduce a fifth major brand color without documenting the decision.

## Color Rhythm

The homepage should move through a controlled rhythm:

```text
WHITE -> PEACH -> WHITE -> BLACK -> PEACH -> WHITE
```

Black should be a deliberate contrast scene, not only text. Green should enter as botanical detail, ingredient cues, tiny icons, or product-adjacent accents, not major buttons or large backgrounds.

## Typography Direction

Use typography to feel editorial but restrained.

Recommended direction:

- Elegant serif for selected display moments.
- Clean modern sans-serif for product, commerce, admin, POS, and body UI.
- Optional script/accent styling only if it stays rare and legible.

Rules:

- No text-heavy hero.
- No long paragraphs in primary homepage viewports.
- One main thought per viewport.
- Many storefront scenes can have no text.
- Admin and POS should use practical sans-serif UI typography.

## Layout Principles

Storefront:

- Mobile-first at 390 x 844.
- Product imagery should dominate early viewports.
- Design for thumb reach.
- Use oversized product frames, portals, masks, foreground depth, and negative space.
- Let products break outside frames when it improves depth.
- Use bottom sheets for quick product details and cart.
- Keep persistent shopping access after the hero.

Admin/POS:

- Use dense but clear layouts.
- Use tables, filters, drawers, split panes, and dialogs where appropriate.
- Do not make staff/admin workflows cinematic.
- Prioritize speed, scanning, and repeated use.

## Product Imagery

Product packaging must remain recognizable. Do not redesign, hallucinate, or materially alter packaging when generating visuals or compositing.

Preferred asset types:

- high-resolution product photos
- transparent-background product cutouts
- consistent front-facing hero assets
- product images by variant
- simple product video or micro-motion assets where available

The environment around products can be cinematic. The products themselves must remain faithful.

## Logo Asset

The supplied square logo is stored at `public/brand/oh-my-kitty-logo.jpeg`. It can be used as a small brand mark in operational surfaces and temporary storefront navigation. For the final premium storefront, request a transparent PNG/SVG version and avoid letting the slogan-heavy square image dominate the cinematic hero.

## Frames And Spatial Containers

Use:

- tall portrait frames
- soft architectural arches
- asymmetric rounded frames
- circular portals
- soft mask reveals
- product frames that feel like gallery objects

Avoid:

- endless card grids as the main discovery language
- heavy box shadows
- generic glassmorphism everywhere
- borders around every product
- cluttered benefit icon rows in the hero

## Core Components

Storefront components:

- cinematic hero
- spatial product carousel
- product bottom sheet
- cart bottom sheet
- product detail page
- category/collection explorer
- sticky mini shop/bag control
- mobile menu panel
- search overlay
- reduced-motion fallbacks

Admin components:

- dashboard widgets
- tables with filters
- edit forms
- media picker
- status badges
- order timeline
- inventory movement table
- role/permission editor
- audit log viewer

POS components:

- product search input
- category shortcuts
- product grid/list
- cart pane
- variant selector
- payment selector
- receipt view
- manager approval modal
- shift open/close dialogs

## Buttons

Storefront:

- Primary commerce CTAs can use near-black text/buttons or peach backgrounds depending on contrast.
- Add to bag must always be readable.
- Avoid using green for primary commerce buttons.
- Keep button labels short: "Add to bag", "Checkout", "View details".

Admin/POS:

- Use clear labels.
- Dangerous actions require confirmation and permissions.
- Large POS actions should be reachable and tappable.

## Bottom Sheets

Product and cart bottom sheets are core to the mobile storefront.

Rules:

- Sheet must not obscure all product context immediately.
- Drag handle must be visible.
- Price, variant, quantity, and Add to bag must be immediately reachable.
- Sheet must be dismissible by drag down and close button.
- Full product details remain available through a normal route.

## Accessibility

- Respect `prefers-reduced-motion`.
- Maintain text contrast.
- Use real buttons and links for interactive controls.
- Touch targets should be at least 44 x 44 px.
- Do not require hidden gestures for core purchases.
- Product images need meaningful alt text.
- Admin/POS must be keyboard usable.

## Anti-Patterns

Do not use:

- purple or purple-blue gradients
- generic SaaS gradients
- neon effects
- hard tech motion
- excessive bounce animations
- desktop-first homepage composition
- long hero paragraphs
- hidden checkout controls
- clinical hospital styling
- cute/cartoon styling that weakens the premium direction
- separate UI visual styles for storefront, admin, and POS that feel unrelated
