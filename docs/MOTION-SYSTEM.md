# Motion System

## Motion Intent

Motion should make the storefront feel like a soft kinetic product world. It should communicate the brand through product, depth, transformation, and restraint.

Motion must never block buying, cart access, checkout, admin tasks, or POS sale completion.

## Motion Vocabulary

Use six motion families:

1. Scroll scrubbing.
2. Spatial depth.
3. Horizontal translation.
4. Portal and mask transitions.
5. Soft parallax.
6. Micro-interactions.

The motion should feel like a beauty/wellness commercial, not a tech demo.

## Mobile Gesture Model

Primary gesture:

- vertical thumb scroll

The site can translate vertical scroll into:

- pinned camera movement
- horizontal section movement
- product separation
- scale/depth shifts
- mask expansion
- portal transitions

Actual horizontal swipe should be used only where users expect it:

- product carousels
- variant selectors
- image galleries
- spatial category browsing

Do not make users learn hidden gestures before they can shop.

## Hero Scroll-Scrub Sequence

The hero should eventually use mobile-specific portrait assets or layered DOM/CSS/animation, not a desktop-heavy sequence squeezed into mobile.

Target structure:

```text
Scroll 0 to 15 percent:
- Hero is still and spacious.
- Products float gently inside a warm white/peach world.
- Botanical depth is visible.
- Text is minimal.

Scroll 15 to 35 percent:
- Camera pushes forward.
- Product group begins separating.
- Foreground botanicals drift across the camera.

Scroll 35 to 55 percent:
- Key products separate diagonally or sideways.
- Text leaves horizontally or fades into mask.
- Product depth becomes clearer.

Scroll 55 to 75 percent:
- A peach architectural frame or portal expands.
- Foreground elements create a soft wipe.
- Background shifts toward peach.

Scroll 75 to 90 percent:
- Portal fills most of the viewport.
- Hero becomes the next product discovery environment.

Scroll 90 to 100 percent:
- Spatial product collection appears.
- Customer can start shopping quickly.
```

Hero product set should support multiple hero products, not a single hardcoded product.

## Spatial Product Discovery

Product browsing should feel like a depth gallery:

- center product is sharp and dominant
- side products peek from edges
- previous/next products rotate slightly away
- incoming product straightens and moves toward the viewer
- background color responds subtly to the selected product
- Add to bag stays obvious

Use this for homepage discovery and selected collection modules. Conventional product grids should still exist for direct shoppers.

## Portal And Mask Transitions

Allowed transitions:

- peach arch expands until it becomes the next background
- product label color fills the viewport and reveals the next scene
- botanical foreground passes across the camera as a wipe
- product frame rotates or scales into the next container
- black contrast scene wipes in horizontally

Avoid hard cuts between primary homepage scenes unless the reduced-motion path requires a simpler transition.

## Horizontal Motion

The user may scroll vertically while the scene moves horizontally. Use this for:

- category worlds
- product collections
- editorial story panels
- black contrast scene entry/exit

Keep orientation clear:

- next item should peek into view
- use simple pagination dots or subtle progress when needed
- avoid trapping the user in a confusing scroll area

## Soft Parallax

Parallax should have three to four depth planes:

- far background color/texture
- product or frame plane
- botanical/ingredient plane
- close foreground blur plane

Use low-intensity parallax. Avoid heavy blur and constant movement that harms mobile performance.

## Micro-Interactions

Required micro-interactions:

- Add to bag: product or thumbnail moves toward bag, bag count updates softly.
- Variant switch: product/media, price, and selected option transition together.
- Button press: slight compression and release.
- Bottom sheet open/close: soft spring with no bounce excess.
- Cart quantity: price updates smoothly.
- Checkout step: clear progress without decorative delays.
- POS actions: instant feedback, no cinematic wait.

## Reduced Motion

Respect `prefers-reduced-motion`.

Reduced-motion behavior:

- frame sequences become static hero plus subtle crossfade
- horizontal scroll scenes become simple slides or standard sections
- parallax is disabled or heavily reduced
- portal transitions become fades/wipes
- micro-interactions remain short and functional

Reduced motion must still look designed, not broken.

## Performance Rules

- Target smooth mobile performance.
- Avoid animating layout properties.
- Prefer transform and opacity.
- Preload only critical first hero assets.
- Lazy-load later product and animation assets.
- Use mobile-specific image sizes.
- Use WebP/AVIF where practical.
- Do not use heavy WebGL as the default homepage approach unless a later decision proves it is necessary.
- If using GSAP/ScrollTrigger or similar, isolate animation setup and cleanup.

## POS/Admin Motion

Admin and POS can use small transitions for clarity, but no cinematic storytelling.

Allowed:

- quick drawer open/close
- row status change feedback
- modal transitions
- toast notifications
- focus states

Not allowed:

- scroll-scrub admin pages
- decorative POS animations that slow checkout
- hidden transitions before sale completion
