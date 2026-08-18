# OH MY KITTY — DESIGN BIBLE
## Authoritative Visual, Motion, Interaction & Experience Specification
**Status:** Source of truth  
**Primary audience:** Claude Code, Codex, designers, frontend engineers, QA  
**Project:** Oh My Kitty ecommerce + admin + POS  
**Primary device:** Mobile  
**Reference viewport:** 390 × 844 px  
**Design system name:** **Soft Spatial Wellness**

---

# 0. NON-NEGOTIABLE DIRECTIVE

This document is the authoritative visual and interaction specification for the Oh My Kitty project.

Do **not** reinterpret this project as a conventional ecommerce website.

Do **not** simplify the storefront into a sequence of ordinary vertically stacked sections because that is easier to implement.

Do **not** replace the spatial motion system with standard fade-in-on-scroll animation.

Do **not** redesign the experience around implementation convenience.

The implementation technique must adapt to the agreed design.

The storefront should feel like a premium feminine wellness campaign that is also shoppable — not a Shopify theme, generic beauty store, SaaS landing page, medical portal, or card-heavy catalogue.

The design priority is:

**Product imagery + spatial motion + negative space + architectural framing + controlled contrast + minimal text.**

The user should experience the site as a connected sequence of visual scenes, not as a stack of boxes.

---

# 1. CORE CREATIVE DIRECTION

## Theme name
**Soft Spatial Wellness**

## Emotional qualities
The brand experience must feel:

- Soft
- Warm
- Premium
- Feminine
- Calm
- Natural
- Intimate
- Editorial
- Confident
- Tactile
- Modern
- Immersive

It must **not** feel:

- Childish
- Loud
- Neon
- Techy
- SaaS-like
- Clinical
- Pharmaceutical
- Hyper-glossy
- Overly cute
- Barbie-like
- Purple / AI-branded
- Template-driven

## Experience idea
The user is not merely scrolling through content.

The viewport behaves like a **camera** moving through a layered wellness world.

Objects can:

- move toward the viewer
- move away from the viewer
- cross in front of text
- pass behind frames
- transform into section transitions
- move horizontally while the user scrolls vertically
- reveal black contrast environments
- become the next shopping interface

The motion itself communicates the brand.

---

# 2. MOBILE-FIRST RULE

Approximately 95% of storefront customers are expected to shop on mobile.

Therefore:

- Design mobile first.
- Build mobile first.
- Test mobile first.
- Optimize motion for mobile first.
- Desktop is an adaptation of the mobile experience, not the primary reference.

## Reference viewport
Use approximately:

**390 × 844 px**

as the primary design reference.

## Mobile rules
- No hover-dependent interaction.
- Primary actions must be thumb-friendly.
- Touch targets should generally be at least 44×44 px.
- Do not hide essential shopping actions inside unfamiliar gestures.
- Vertical thumb scrolling remains the default navigation gesture.
- Horizontal movement may be driven by vertical scrolling.
- Horizontal swiping should be reserved for interactions where users naturally expect it:
  - products
  - variants
  - galleries
  - collections

---

# 3. COLOR SYSTEM

The client-specified colors are mandatory:

- White
- Peach shade of pink
- Black
- A little green

The design must not introduce a competing brand color.

## Core tokens

### Warm white
`--omk-white: #FFF9F6`

Primary background.

### Soft cream
`--omk-cream: #FFF2EC`

Secondary neutral surface.

### Peach primary
`--omk-peach: #F3A99D`

Primary emotional accent.

### Peach light
`--omk-peach-light: #FAD8D0`

Soft environmental use.

### Peach wash
`--omk-peach-wash: #FDEBE6`

Subtle background atmosphere.

### Near black
`--omk-black: #111111`

Main contrast tone.

### Soft black
`--omk-black-soft: #1B1B1B`

Secondary black surface.

### Botanical green
`--omk-green: #556B45`

Restrained natural accent.

### Botanical soft
`--omk-green-soft: #849373`

Secondary natural tone.

## Recommended visual ratio

- Warm white / cream: **60–65%**
- Peach family: **20–25%**
- Near-black family: **10–15%**
- Botanical green: **3–5%**

## Color rhythm
The storefront should not remain peach for the entire experience.

Preferred scene rhythm:

**Warm White → Peach → Warm White → Near Black → Peach → Warm White**

The black scene is intentional and important. It creates dramatic contrast and allows the pink product packaging to become visually powerful.

## Green usage
Green is not a major CTA color.

Use it for:

- botanical imagery
- small natural ingredient indicators
- micro-icons
- restrained badges
- subtle accent copy
- plant/ingredient scenes

Do not use large green hero backgrounds unless specifically approved.

---

# 4. TYPOGRAPHY

Typography must feel editorial and premium.

## Display typography
Use a refined high-contrast serif.

Best for:
- short hero statements
- collection titles
- product storytelling
- large editorial moments

Examples of intended tone:
- “Intimate care.”
- “Naturally.”
- “Care differently.”
- “Shop your care.”

## UI typography
Use a clean modern sans-serif.

Use for:
- navigation
- prices
- filters
- buttons
- form fields
- admin
- POS
- checkout

## Script accent
A script face may be used very sparingly for a single highlighted word.

Example:
**Naturally.**

Do not use handwritten/script type for full headings or body copy.

## Copy density
This is a critical rule:

**Maximum one main thought per viewport.**

Many visual scenes may contain no body copy at all.

Do not compensate for weak design with extra text.

The storefront should communicate through:
- imagery
- motion
- composition
- product scale
- color
- transitions

---

# 5. SHAPE LANGUAGE

The visual system should use a small set of repeatable shapes.

## Architectural portals
Tall, soft arch forms.

Use them as:
- hero framing
- masks
- depth layers
- transitions
- category frames
- visual portals between scenes

## Product frames
Tall portrait frames with soft radii.

Products may:
- break outside the frame
- overlap frame edges
- sit partially in front of the frame
- move behind another frame
- scale through the frame

## UI containers
Use soft rounding.

Recommended:
- cards / sheets: 16–24 px
- bottom sheets: 24–32 px
- buttons: soft rounded rectangles
- pills: only for true controls

Do not turn every text label into a pill.

---

# 6. PHOTOGRAPHY & PRODUCT ART DIRECTION

Products are the visual hero.

## Product image rules
- Real product packaging must remain visually accurate.
- Do not AI-redesign labels, claims, logos, colors, bottle shapes, or pack information.
- Product cutouts should use high-resolution transparent PNG/WebP where possible.
- Do not distort aspect ratio.
- Product shadows should remain soft and grounded.
- Use perspective sparingly unless the asset supports it.

## Preferred environment
Use:
- warm-white studio space
- peach stone / marble surfaces
- soft peach architecture
- blurred botanical foreground
- botanical midground
- petals
- subtle flowers
- restrained natural textures
- occasional black studio environment

## Depth treatment
The same product may exist across multiple perceived depths:
- foreground
- subject plane
- midground
- architectural frame
- distant background

## Product behavior
Products may:
- float subtly
- move toward camera
- move sideways
- separate from one another
- pass over/under typography
- cross architectural frames
- transition into collection cards

Avoid excessive product spinning unless a genuine multi-angle asset sequence exists.

---

# 7. STOREFRONT EXPERIENCE MODEL

The storefront is a connected sequence of cinematic scenes.

The user should not feel:

> “I just entered another rectangular section.”

Instead, one scene should transform into the next.

Preferred homepage structure:

1. Cinematic Hero
2. Portal Transition
3. Spatial Collection Explorer
4. Product Focus
5. Black World
6. Natural / Ingredient Story
7. Find Your Care
8. Best Sellers
9. Trust / Social Proof
10. Shop
11. Footer

---

# 8. HERO — SOURCE OF TRUTH

The existing **Oh My Kitty cinematic hero motion storyboard** is the visual reference for the hero.

Recommended filename in the repository:

`/references/hero/OMK-HERO-MOTION-BOARD.png`

The storyboard should be treated as a visual target, not as optional inspiration.

The hero should use the real uploaded product assets where available.

## Hero visual setup
Primary subjects:
- Slippery Elm bottle
- Infection Flusher pouch

Visual layers:
1. foreground blurred botanicals
2. particles / petals
3. hero bottle
4. secondary product
5. architectural peach portal
6. environment / background

This is a 2.5D / spatial composition.

A full WebGL world is not required unless proven necessary.

Recommended implementation:
- CSS perspective
- transform layers
- GSAP / ScrollTrigger
- selective image sequence if needed
- GPU-friendly transforms

---

# 9. HERO SCROLL CHOREOGRAPHY

The hero remains pinned for approximately 250–350vh of scroll.

The user scrolls vertically, but the viewport behaves like a camera.

## 0–15% — REST / ESTABLISH
- Hero is calm.
- Product composition is fully visible.
- Products float subtly.
- Foreground botanicals drift minimally.
- Portal scale: ~1.0
- Bottle scale: ~1.0
- Pouch scale: ~0.88
- Minimal copy:
  - “Intimate care.”
  - optional script accent: “Naturally.”
- Navbar remains minimal.

No conventional upward section movement.

## 15–35% — CAMERA PUSH
- Camera appears to move closer.
- Portal scale: ~1.0 → 1.35
- Bottle scale: ~1.0 → 1.4
- Bottle translates slightly upward.
- Pouch moves deeper / slightly off-center.
- Foreground leaf crosses close to camera.
- Foreground blur increases.
- Copy begins leaving the composition.

The user should feel forward movement, not scrolling.

## 35–55% — DEPTH / ORBIT
- Hero bottle travels across the scene.
- Suggested:
  - `x: 0 → +20vw`
  - `rotateZ: 0 → +5–7deg`
- Pouch counter-moves:
  - `x: 0 → -15–20vw`
- Text may appear behind the product.
- Example micro-copy:
  - “NATURAL”
- Product crosses in front of typography.
- No large paragraph.

## 55–75% — SEPARATION
- Products separate.
- Bottle continues right.
- Pouch moves left.
- Portal expands horizontally.
- Product scale differences increase to reinforce depth.
- Black begins appearing through the center of the portal.
- Peach environment starts behaving like a physical frame.

## 75–90% — PORTAL / PASS THROUGH
- Portal expands beyond the viewport.
- Camera appears to travel through it.
- Foreground peach elements blur across the viewport.
- Warm environment disappears.
- Background becomes near-black.

No conventional cut.

The portal itself becomes the transition.

## 90–100% — BLACK WORLD / SHOP TRANSFORMATION
- Products float against near-black.
- Pink packaging becomes high contrast.
- One restrained green botanical crosses the frame.
- Suggested copy:
  - “Care differently.”
- Three architectural product frames emerge at different depths.
- Center frame moves toward the viewer.
- Side frames remain partially visible.
- Final hero state transforms directly into the collection/product browser.

The hero must not end with:
“scroll down to next section.”

It must become the next experience.

---

# 10. MOTION SYSTEM

The project uses six primary motion families.

Every animation should belong to one of them.

## A. Scroll Scrubbing
Scroll position directly controls motion progress.

Use for:
- hero
- portal movement
- spatial product separation
- major scene transformations

## B. Spatial Depth
Objects move toward or away from the viewer.

Use:
- scale
- perspective
- parallax
- blur
- z-order
- relative speed

## C. Horizontal Translation
Vertical scrolling may create horizontal movement.

Use for:
- collection exploration
- editorial product scenes
- product worlds

Do not require horizontal finger swiping unless it is clearly a swipeable control.

## D. Portal / Mask Transitions
Shapes become transition mechanisms.

Use:
- arches
- circles
- product silhouettes
- leaves
- frame masks

A shape may grow until it covers the screen and becomes the next background.

## E. Soft Parallax
Foreground, subject, and background move at different speeds.

Use conservatively.

The goal is depth, not motion noise.

## F. Micro-interactions
Use for:
- add to cart
- variant selection
- menu
- cart count
- buttons
- prices
- bottom sheets
- filter selection
- loading states

Micro-interactions must remain soft and tactile.

---

# 11. MOTION FEEL

Motion should feel:
- weightless
- fluid
- calm
- tactile
- cinematic
- premium
- controlled

Avoid:
- aggressive zooming
- bouncing
- constant shaking
- elastic overload
- neon motion trails
- tech-demo animation
- random scroll-triggered fades

Preferred easing:
- soft ease-out
- controlled cubic-bezier curves
- restrained spring settling where appropriate

---

# 12. TEXT ANIMATION

Text animation must remain subtle.

Allowed:
- mask reveals
- clipping reveals
- horizontal drift
- line-by-line reveal
- text moving behind product
- word substitution
- opacity transition
- gentle tracking changes

Avoid:
- typewriter effects
- bouncing letters
- spinning text
- every word animating independently
- excessive stagger effects

Text must never become the primary spectacle.

---

# 13. SECTION TRANSITION RULES

The site must not become an endless vertical stack.

Each major section should use at least one of the following:
- product movement
- portal transition
- horizontal translation
- mask reveal
- depth change
- camera push
- scale transformation
- foreground wipe
- black contrast reveal

Examples:

### Peach portal → black world
Peach arch expands while black becomes visible inside the opening.

### Leaf wipe
A blurred leaf crosses close to camera, covers the viewport, then reveals a new scene.

### Product-to-background
A product label or color field grows until it becomes the next section environment.

### Frame transformation
A product frame expands and becomes the container of the next scene.

### Horizontal gallery
Vertical scroll moves categories laterally.

---

# 14. SPATIAL COLLECTION EXPLORER

After the hero, shopping begins quickly.

Core categories may include:
- Intimate Care
- Wellness Supplements
- Herbal Care

The collection explorer must feel spatial.

Preferred behavior:
- center product/frame is dominant
- adjacent products peek from edges
- side frames appear slightly smaller / deeper
- vertical scroll may drive horizontal motion
- touch swipe may also work
- incoming frame straightens as it becomes active
- outgoing frame tilts subtly and recedes

Do not use a standard four-card category grid as the primary experience.

---

# 15. PRODUCT BROWSING

The experience can be unconventional, but shopping must remain obvious.

## Product focus
When a product becomes active:
- image should dominate
- product name visible
- size / variant visible
- price visible
- Add to Bag obvious

## Product preview
The next product should slightly peek from the edge where possible.

This implies discoverability without instructions.

## Conventional Shop page
A straightforward Shop page must still exist.

Use:
- search
- filters
- category
- sort
- availability
- product cards
- quick add

The Shop page may be more conventional than the homepage, but must retain the design system.

---

# 16. PRODUCT DETAIL EXPERIENCE

Mobile product detail should feel immersive but shoppable.

## Top visual
- large product
- warm-white or product-specific environment
- minimal copy
- price
- variant
- quantity
- add to bag

## Bottom sheet preview
Tapping a product from browsing may open a bottom sheet.

The product remains visible above/behind it.

Bottom sheet may contain:
- product name
- size
- price
- rating
- short benefit summary
- variant
- quantity
- Add to Bag
- “View full details”

Swipe down closes the sheet.

## Full product page
Continue with:
- visual benefits
- ingredients
- how to use
- reviews
- related products

Do not begin with a wall of text.

---

# 17. VARIANT SYSTEM

Do not use a generic dropdown for important variants.

Preferred:
- visible option cards
- horizontal swipe
- segmented selector
- framed choices

Examples:
- 30 capsules
- 60 capsules
- 90 capsules
- 50ml
- 100ml

Selecting a variant should trigger:
- subtle product scale/position change
- numeric price transition
- active-state motion
- image change where real assets exist

Do not fabricate packaging for variants without real assets.

---

# 18. CART

Mobile cart should preferably be a bottom sheet before full checkout.

Cart must support:
- product
- variant
- quantity
- price
- remove
- subtotal
- discount
- checkout

Motion:
- sheet rises softly
- backdrop darkens subtly
- cart count updates smoothly

Add-to-cart interaction may make the product scale toward the cart icon, but must not delay commerce.

---

# 19. CHECKOUT

Checkout is intentionally conventional.

The user has already decided to buy.

Priorities:
- clarity
- speed
- trust
- large touch targets
- minimal distractions
- reliable forms
- strong payment hierarchy

Use the same colors and typography, but significantly reduce cinematic motion.

---

# 20. NAVIGATION

## Mobile top bar
Minimal.

Suggested:
- logo
- menu
- bag

## After hero
A subtle floating bottom navigation may appear.

Possible items:
- Shop
- Search
- Bag

Use a translucent / frosted warm-white surface sparingly.

## Menu
Do not use a generic dropdown.

Preferred:
- peach panel slides sideways
- current scene recedes slightly
- menu enters forward
- large editorial navigation labels
- botanical/product visual layer behind

---

# 21. FIND YOUR CARE

Short interactive recommendation flow.

Keep it simple.

Examples:
- Daily Care
- Wellness
- Herbal Support

No long questionnaire.

Recommended product should physically enter the scene after the final answer.

---

# 22. BLACK WORLD

The black contrast scene is a core brand moment.

Use near-black:
`#111111`

The scene should:
- feel cinematic
- use minimal copy
- emphasize pink/white packaging
- use restrained botanical green
- use controlled depth
- avoid excessive UI

Example:
“Care differently.”

Do not overuse black elsewhere.

---

# 23. INGREDIENT / NATURAL STORY

Do not use a generic feature-icon grid as the primary storytelling method.

Preferred pattern:
- product centered
- ingredient enters
- one word appears
- scroll changes composition
- next ingredient appears

Possible words:
- Natural
- Gentle
- Made for her

Motion does the storytelling.

---

# 24. ADMIN DESIGN

The admin belongs to the same brand but prioritizes operations.

Use:
- warm white
- near black
- peach highlights
- restrained green for positive status
- clean tables
- clear cards
- strong hierarchy

Do not use cinematic homepage motion in admin.

Admin should feel:
**premium + operational**

Core areas:
- dashboard
- products
- categories
- inventory
- orders
- fulfilment
- customers
- content
- media
- promotions
- delivery
- payments
- reports
- users
- roles
- settings

---

# 25. POS DESIGN

The POS is a third interface.

Its priorities:
1. speed
2. clarity
3. touch usability
4. inventory accuracy
5. checkout speed

Use:
- warm white / cream
- near black
- peach primary controls
- green for paid / success / in stock
- red only for warnings/errors

No cinematic transitions in POS.

POS should support:
- product search
- category shortcuts
- product grid/list
- variants
- cart
- customer selection
- walk-in customer
- quantity
- permitted discounts
- payments
- receipt
- hold/resume cart
- order lookup
- returns/refunds with permission
- shifts
- staff sales history

Admin-created staff accounts use RBAC.

---

# 26. MOTION VS COMMERCE RULE

This project intentionally separates:

## Brand experience
Can be:
- cinematic
- spatial
- unusual
- animated
- editorial

## Commerce UI
Must be:
- predictable
- fast
- obvious
- accessible
- reliable

Never make checkout, price, quantity, Add to Bag, stock state, or payment difficult to find.

---

# 27. PERFORMANCE RULES

Mobile performance is part of the design.

This is especially important for mobile networks.

## Required
- responsive images
- WebP / AVIF
- mobile-specific asset sizes
- lazy load below-the-fold media
- preload only critical hero assets
- GPU-friendly transforms
- avoid layout-triggering animation
- avoid excessive heavy blur
- compress frame sequences
- progressive loading
- reduce unnecessary JavaScript
- use CSS transforms where possible
- optimize GSAP timelines

## Hero sequence
Do not preload hundreds of full-resolution frames immediately.

If using an image sequence:
- use mobile-specific output
- progressively preload
- preload first visible range
- lazy-load later frames
- consider adaptive quality

## Performance target
The experience should aim to feel fluid on a typical modern mid-range mobile device.

Do not design only for flagship iPhones.

---

# 28. REDUCED MOTION

Respect `prefers-reduced-motion`.

Fallback behavior:
- frame sequence → controlled crossfade/static keyframe
- horizontal depth → simple slide
- heavy parallax → disabled
- portal movement → simpler mask/fade
- product motion → reduced transform distance

Commerce must remain fully functional.

The site must still look intentional.

---

# 29. ACCESSIBILITY

Requirements:
- clear contrast
- readable body sizes
- keyboard access where relevant
- focus states
- semantic HTML
- alt text
- form labels
- accessible errors
- touch target size
- no critical information only communicated through animation
- reduced motion support

Avoid ultra-light peach text on white.

---

# 30. DESIGN TOKENS

Do not scatter random Tailwind colors throughout the codebase.

Create reusable semantic tokens.

Recommended names:
- `background`
- `surface`
- `surface-soft`
- `foreground`
- `muted`
- `peach`
- `peach-light`
- `peach-wash`
- `black`
- `black-soft`
- `botanical`
- `botanical-soft`
- `border`
- `success`
- `warning`
- `danger`

Components should consume tokens instead of arbitrary color utilities.

---

# 31. REUSABLE COMPONENT LANGUAGE

Recommended shared components:
- `OMKButton`
- `OMKIconButton`
- `OMKBottomSheet`
- `OMKPortalFrame`
- `OMKProductFrame`
- `OMKProductStage`
- `OMKSpatialCarousel`
- `OMKVariantSelector`
- `OMKCartSheet`
- `OMKMobileNav`
- `OMKSectionTransition`
- `OMKBlackScene`
- `OMKBotanicalLayer`
- `OMKMaskReveal`
- `OMKScrollScene`

These names are illustrative.

The important principle is to centralize visual behavior.

---

# 32. ASSET RULES

Repository structure should clearly separate:
- real products
- botanicals
- portal/frame assets
- textures
- motion references
- hero storyboard
- generated environment assets

Suggested:

```text
/public/omk/
  products/
  botanicals/
  portals/
  textures/
  motion/

/references/
  hero/
  mobile/
```

Never overwrite original source product imagery.

---

# 33. CMS / ADMIN CONTENT BOUNDARY

The client may edit:
- hero product selection
- hero headline
- homepage micro-copy
- product images
- featured collections
- promotions
- text
- banners
- FAQs
- content pages
- delivery text

The client should **not** freely rearrange core animation choreography.

This is a controlled CMS, not a freeform page builder.

The structure of cinematic scenes should remain protected.

---

# 34. FORBIDDEN PATTERNS

Claude/Codex must not introduce these without explicit approval:

- generic ecommerce hero banner
- huge paragraph-heavy hero
- standard “image left / text right” section repetition
- endless vertical section stacking
- repetitive fade-up-on-scroll
- excessive boxed cards
- SaaS dashboard styling on storefront
- purple
- blue as a brand color
- AI-style gradients
- neon glows
- random pastel colors
- excessive handwritten typography
- feature-icon grids as primary storytelling
- every control turned into a pill
- large green CTAs
- autoplay-heavy video that blocks shopping
- hover-dependent mobile behavior
- conventional product grid as the homepage’s main experience
- redesigning real packaging
- fake product claims
- fabricated product angles
- excessive text
- visually noisy backgrounds
- scroll-jacking that prevents expected navigation
- animation that makes Add to Bag or Checkout slow

---

# 35. IMPLEMENTATION SEQUENCE

The design should be implemented in controlled passes.

## Pass 1 — Theme Foundation
Implement:
- color tokens
- typography
- spacing
- button system
- surfaces
- frame components
- navbar
- bottom sheets
- mobile layout primitives

No major motion yet.

## Pass 2 — Homepage Static Composition
Build the mobile homepage composition accurately.

Do not animate until composition matches the reference.

## Pass 3 — Hero Motion
Implement:
- pinning
- depth layers
- camera push
- product separation
- portal
- black world
- shop transformation

## Pass 4 — Spatial Collection Explorer
Implement:
- horizontal depth
- product peeking
- vertical-scroll-driven lateral movement
- optional swipe

## Pass 5 — Shop / Category
Apply the visual system while prioritizing usability.

## Pass 6 — Product Detail
Implement:
- product stage
- variants
- bottom sheet
- Add to Bag
- ingredients story

## Pass 7 — Cart / Checkout
Keep commerce predictable.

## Pass 8 — Admin
Premium but operational.

## Pass 9 — POS
Fast and functional.

## Pass 10 — Optimization / QA
Test:
- Android
- iOS Safari
- low/medium network
- reduced motion
- touch
- performance
- accessibility
- visual consistency

---

# 36. VISUAL QA PROCESS

Do not redesign the whole site in one pass.

For visual work:

1. Build one state.
2. Capture a screenshot.
3. Compare against approved reference.
4. Correct composition.
5. Only then add motion.
6. Capture key motion states.
7. Compare again.
8. Continue to next scene.

For the hero:
- validate REST
- validate CAMERA PUSH
- validate DEPTH
- validate SEPARATION
- validate PORTAL
- validate BLACK WORLD
- validate SHOP TRANSFORMATION

Do not move ahead if the current state visibly deviates.

---

# 37. ACCEPTANCE CRITERIA — THEME

A storefront page is not considered finished unless:

- it uses the approved palette
- white remains dominant
- peach feels warm, not neon
- black contrast is intentional
- green is restrained
- copy is minimal
- typography feels editorial
- product imagery dominates
- mobile layout feels designed, not compressed
- touch targets are comfortable
- no generic SaaS styling is present
- no unrelated brand colors are introduced

---

# 38. ACCEPTANCE CRITERIA — MOTION

Major homepage motion is not considered finished unless:

- scroll controls a deliberate timeline
- hero remains spatial rather than vertically stacked
- depth is visible
- products move independently
- foreground/midground/background have different motion
- at least one portal/mask transition exists
- at least one horizontal movement is driven by vertical scroll
- black world is included
- hero transforms into product discovery
- motion is reversible on scroll where appropriate
- frame rate remains acceptable on mobile
- reduced-motion fallback exists
- Add to Bag remains immediately usable

---

# 39. ACCEPTANCE CRITERIA — MOBILE

A page is not considered approved unless checked at approximately:
- 360 px width
- 390 px width
- 430 px width

Verify:
- no horizontal overflow
- no clipped CTA
- no tiny text
- no inaccessible controls
- product remains visually dominant
- motion is smooth
- scroll behavior is understandable
- next product/interaction is discoverable
- sticky/floating elements do not obstruct content

---

# 40. CLAUDE / CODEX WORKING RULE

Before modifying storefront UI, Claude/Codex must read this file.

For hero/motion work, it must also inspect the approved hero storyboard.

If the visual reference and implementation differ, the implementation should be changed to approach the reference.

Do **not** reinterpret the brief into a conventional ecommerce layout.

If a specific implementation technique cannot reproduce an approved design, select a different implementation technique.

Do not redesign the approved experience merely because another implementation would be easier.

---

# 41. FINAL DESIGN PRINCIPLE

The storefront should create two reactions simultaneously:

> “This is beautiful and different.”

and

> “This is incredibly easy to shop.”

The cinematic layer creates desire.

The commerce layer removes friction.

Both are required.

---

# 42. SHORT SOURCE-OF-TRUTH SUMMARY

**Design system:** Soft Spatial Wellness  
**Primary platform:** Mobile  
**Main colors:** Warm white, peach-pink, near-black, restrained botanical green  
**Copy:** Minimal  
**Primary storytelling:** Product imagery + motion  
**Hero:** Pinned, scroll-scrubbed, spatial, portal-driven  
**Navigation:** Touch-first  
**Sections:** Transform into one another  
**Horizontal motion:** Yes, frequently driven by vertical scroll  
**Black contrast scene:** Required  
**Product interaction:** Spatial + familiar commerce controls  
**Cart:** Mobile bottom sheet preferred  
**Checkout:** Conventional  
**Admin:** Premium operational  
**POS:** Fast operational  
**Real packaging:** Must remain accurate  
**Performance:** Mobile-first and mandatory  
**Generic ecommerce redesign:** Forbidden

---

**END OF OH MY KITTY DESIGN BIBLE**
