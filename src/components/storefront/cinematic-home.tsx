"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useLayoutEffect, useRef } from "react";
import { addLineToCart, type CartLine } from "@/components/storefront/add-to-bag-button";
import { openCart } from "@/lib/storefront/cart-store";
import { CartCount } from "@/components/storefront/cart-count";
import { CartTrigger } from "@/components/storefront/cart-trigger";
import { StorefrontNav } from "@/components/storefront/storefront-nav";
import type { StorefrontCategorySummary, StorefrontProductView } from "@/lib/storefront/catalogue";

type CinematicHomeProps = {
  categories: StorefrontCategorySummary[];
  products: StorefrontProductView[];
};

// Firebase Hosting's CDN has repeatedly kept serving an old cached copy of
// this file after a deploy, even with a max-age=0 origin header — some edge
// nodes just don't revalidate reliably. A version query string forces a new
// cache key instead of depending on that. Bump this any time the hero video
// or its poster frame changes.
const HERO_VIDEO_VERSION = "3";

const WORLD_TILE_CYCLE = ["tall", "small", "wide", "small"] as const;
const EXHIBITION_VARIANT_CYCLE = ["a", "b", "c", "d", "e"] as const;

/**
 * Sample review fragments — placeholder copy only, not real customer reviews.
 * Replace with genuine testimonials before this section goes live in production.
 */
const SAMPLE_REVIEWS = [
  { initials: "A.K.", quote: "Gentle and effective, exactly what I needed." },
  { initials: "N.O.", quote: "My new daily ritual. Feels made for me." },
  { initials: "S.T.", quote: "Fast delivery and the packaging is so soft." },
  { initials: "P.D.", quote: "Finally a brand that gets it right." }
] as const;

type HeroBreakpointConfig = {
  portalPush: number;
  portalAnticipate: number;
  portalZoom: number;
  bottlePush: number;
  bottleCrossX: string;
  bottleOrbitX: string;
  bottleSeparationX: string;
  bottleRotate: number;
  pouchCrossX: string;
  pouchOrbitX: string;
  pouchSeparationX: string;
  pouchScaleDown: number;
  leafLeftRestDrift: [string, string];
  leafRightRestDrift: [string, string];
  leafFlyByX: [string, string];
};

const MOBILE_HERO_CFG: HeroBreakpointConfig = {
  portalPush: 1.3,
  portalAnticipate: 2.6,
  portalZoom: 11,
  bottlePush: 1.35,
  bottleCrossX: "-10vw",
  bottleOrbitX: "16vw",
  bottleSeparationX: "32vw",
  bottleRotate: 6,
  pouchCrossX: "8vw",
  pouchOrbitX: "-14vw",
  pouchSeparationX: "-30vw",
  pouchScaleDown: 0.4,
  leafLeftRestDrift: ["-8vw", "-5vh"],
  leafRightRestDrift: ["8vw", "5vh"],
  leafFlyByX: ["-70vw", "70vw"]
};

const TABLET_HERO_CFG: HeroBreakpointConfig = {
  portalPush: 1.25,
  portalAnticipate: 2.3,
  portalZoom: 9,
  bottlePush: 1.3,
  bottleCrossX: "-8vw",
  bottleOrbitX: "12vw",
  bottleSeparationX: "24vw",
  bottleRotate: 5,
  pouchCrossX: "6vw",
  pouchOrbitX: "-11vw",
  pouchSeparationX: "-22vw",
  pouchScaleDown: 0.4,
  leafLeftRestDrift: ["-6vw", "-4vh"],
  leafRightRestDrift: ["6vw", "4vh"],
  leafFlyByX: ["-60vw", "60vw"]
};

const DESKTOP_HERO_CFG: HeroBreakpointConfig = {
  portalPush: 1.2,
  portalAnticipate: 2,
  portalZoom: 7,
  bottlePush: 1.25,
  bottleCrossX: "-6vw",
  bottleOrbitX: "8vw",
  bottleSeparationX: "18vw",
  bottleRotate: 4,
  pouchCrossX: "5vw",
  pouchOrbitX: "-9vw",
  pouchSeparationX: "-18vw",
  pouchScaleDown: 0.45,
  leafLeftRestDrift: ["-4vw", "-3vh"],
  leafRightRestDrift: ["4vw", "3vh"],
  leafFlyByX: ["-50vw", "50vw"]
};

/**
 * Master hero timeline — 10 phases (OMK-HOMEPAGE-MOTION-PASS-V3 section 5), scrubbed
 * across a single pinned ScrollTrigger spanning ~450vh. Time units below are percent
 * of that pin distance (0-100), matching the spec's own phase percentages directly.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildHeroTimeline(gsap: any, cfg: HeroBreakpointConfig) {
  gsap.set(".hero-scene-portal", { xPercent: -50, yPercent: -50, scale: 1 });
  gsap.set(".hero-scene-bottle", { xPercent: -50, yPercent: -50, scale: 1, x: 0, rotateZ: 0 });
  gsap.set(".hero-scene-pouch", { xPercent: -50, yPercent: -50, scale: 0.88, x: 0 });
  gsap.set(".hero-scene-leaf.leaf-left, .hero-scene-leaf.leaf-right", { x: 0, y: 0, filter: "blur(1.5px)" });

  const tl = gsap.timeline();

  // Phase 00 — AMBIENT REST (0-10%): quiet opening, subtle drift only.
  tl.to(".hero-scene-petals.petals-a", { y: -6, duration: 10, ease: "sine.inOut" }, 0)
    .to(".hero-scene-petals.petals-b", { y: 6, duration: 10, ease: "sine.inOut" }, 0)
    .to(".hero-scene-bottle", { y: -6, duration: 10, ease: "sine.inOut" }, 0);

  // Phase 01 — CAMERA PUSH (10-25%): the viewport starts feeling like a camera.
  tl.to(".hero-scene-portal", { scale: cfg.portalPush, duration: 15, ease: "power1.inOut" }, 10)
    .to(".hero-scene-bottle", { scale: cfg.bottlePush, y: -20, duration: 15, ease: "power1.inOut" }, 10)
    .to(".hero-scene-pouch", { scale: 0.7, x: cfg.pouchCrossX, opacity: 0.8, duration: 15, ease: "power1.inOut" }, 10)
    .to(
      ".hero-scene-leaf.leaf-left",
      {
        x: cfg.leafLeftRestDrift[0],
        y: cfg.leafLeftRestDrift[1],
        filter: "blur(4px)",
        duration: 15,
        ease: "power1.inOut"
      },
      10
    )
    .to(
      ".hero-scene-leaf.leaf-right",
      {
        x: cfg.leafRightRestDrift[0],
        y: cfg.leafRightRestDrift[1],
        filter: "blur(4px)",
        duration: 15,
        ease: "power1.inOut"
      },
      10
    )
    .to(".hero-scene-copy", { opacity: 0, y: -18, duration: 10, ease: "power1.in" }, 10);

  // Phase 02 — PRODUCT / TYPOGRAPHY CROSS (25-40%): the word sits center-screen and
  // the primary product sweeps across it, so the word is briefly visible behind glass.
  tl.to(".hero-scene-microcopy", { opacity: 1, duration: 5, ease: "power1.out" }, 26)
    .to(".hero-scene-bottle", { x: cfg.bottleCrossX, rotateZ: -3, duration: 15, ease: "power1.inOut" }, 25)
    .to(".hero-scene-microcopy", { opacity: 0, duration: 5, ease: "power1.in" }, 37)
    .to(".hero-scene-pouch", { x: 0, scale: 0.62, duration: 15, ease: "power1.inOut" }, 25);

  // Phase 03 — FOREGROUND FLY-BY (40-55%): a leaf sweeps close to camera, blurring
  // and briefly obscuring the scene before revealing the depth/orbit composition.
  tl.to(
      ".hero-scene-leaf.leaf-left",
      { x: cfg.leafFlyByX[0], scale: 1.6, filter: "blur(18px)", duration: 8, ease: "power2.in" },
      40
    )
    .to(
      ".hero-scene-leaf.leaf-right",
      { x: cfg.leafFlyByX[1], scale: 1.6, filter: "blur(18px)", duration: 8, ease: "power2.in" },
      40
    )
    .to(".hero-scene-leaf.leaf-left, .hero-scene-leaf.leaf-right", { opacity: 0, duration: 4, ease: "power1.in" }, 48)
    .to(".hero-scene-bottle", { rotateZ: 2, duration: 15, ease: "power1.inOut" }, 40);

  // Phase 04 — DEPTH / ORBIT (55-68%): strongest spatial moment before separation.
  tl.to(".hero-scene-bottle", { x: cfg.bottleOrbitX, rotateZ: cfg.bottleRotate, duration: 13, ease: "power1.inOut" }, 55)
    .to(".hero-scene-pouch", { x: cfg.pouchOrbitX, scale: 0.55, duration: 13, ease: "power1.inOut" }, 55);

  // Phase 05 — SEPARATION (68-78%): products separate; darkness becomes visible
  // through the portal's opening rather than a simple background fade.
  tl.to(".hero-scene-bottle", { x: cfg.bottleSeparationX, scale: cfg.bottlePush + 0.15, duration: 10, ease: "power1.inOut" }, 68)
    .to(
      ".hero-scene-pouch",
      { x: cfg.pouchSeparationX, scale: cfg.pouchScaleDown, opacity: 0.5, duration: 10, ease: "power1.inOut" },
      68
    )
    .to(".hero-scene-portal", { scale: cfg.portalAnticipate * 0.72, duration: 10, ease: "power1.inOut" }, 68)
    .to(".hero-scene-blackworld", { clipPath: "circle(16% at 50% 50%)", duration: 10, ease: "power1.inOut" }, 68);

  // Phase 06 — PORTAL ANTICIPATION (78-88%): a deliberate slow beat before pass-through.
  tl.to(".hero-scene-portal", { scale: cfg.portalAnticipate, duration: 10, ease: "sine.inOut" }, 78)
    .to(".hero-scene-blackworld", { clipPath: "circle(26% at 50% 50%)", duration: 10, ease: "sine.inOut" }, 78)
    .to(".hero-scene-bottle", { scale: cfg.bottlePush + 0.3, duration: 10, ease: "sine.inOut" }, 78)
    .to(".hero-scene-petals", { scale: 1.2, duration: 10, ease: "sine.inOut" }, 78);

  // Phase 07 — PORTAL ACCELERATION / TRUE PASS-THROUGH (88-95%): the circle exceeds
  // the viewport — no hard cut, no simple opacity fade, a real camera transition.
  tl.to(".hero-scene-portal", { scale: cfg.portalZoom, opacity: 0, duration: 7, ease: "power3.in" }, 88)
    .to(".hero-scene-blackworld", { clipPath: "circle(150% at 50% 50%)", duration: 7, ease: "power3.in" }, 88)
    .to(".hero-scene-pouch", { opacity: 0, filter: "blur(10px)", duration: 5, ease: "power2.in" }, 88)
    .to(".hero-scene-petals", { opacity: 0, filter: "blur(10px)", duration: 5, ease: "power2.in" }, 88);

  // Phase 08 — BLACK WORLD ARRIVAL (95-98%): dramatic arrival, restrained composition.
  tl.to(".hero-scene-copy-black", { opacity: 1, duration: 3, ease: "power1.out" }, 95)
    .to(".hero-scene-bottle", { x: 0, scale: 1.1, rotateZ: 0, opacity: 1, duration: 3, ease: "power1.inOut" }, 95);

  // Phase 09 — TRANSFORM INTO DISCOVERY (98-100%): no visible section cut — the hero
  // itself becomes the next (dark spatial gallery) scene as the pin releases.
  tl.to(".hero-scene-copy-black", { opacity: 0, duration: 2, ease: "power1.in" }, 98).to(
    ".hero-scene-bottle",
    { scale: 0.9, y: -30, duration: 2, ease: "power1.inOut" },
    98
  );

  return tl;
}

export function CinematicHome({ categories, products }: CinematicHomeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const bestSellers = products.filter((product) => product.bestSeller);
  const dominantSeller = bestSellers[0];
  const peekingSellers = bestSellers.slice(1, 4);
  const worldProducts = products.slice(0, 10);
  const ingredientProduct =
    products.find((product) => product.slug === "slippery-elms-dietary-supplement") ?? products[0];
  const reviewAccentA = products[3];
  const reviewAccentB = products[6];

  // The `autoPlay` attribute (below) is what reliably starts playback —
  // browsers handle its readiness timing far better than a manual .play()
  // call in an effect. This layout effect only steps in to slow the clip
  // to a calmer ambient pace, and to immediately pause it for a
  // reduced-motion visitor, before the first paint.
  useLayoutEffect(() => {
    const video = heroVideoRef.current;
    if (!video) {
      return;
    }
    video.playbackRate = 0.5;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
    }
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let active = true;
    let context: { revert: () => void } | null = null;

    async function loadMotion() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger")
      ]);

      if (!active || !rootRef.current) {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);
      context = gsap.context(() => {
        const mm = gsap.matchMedia();

        mm.add(
          {
            isMobile: "(max-width: 767px)",
            isTablet: "(min-width: 768px) and (max-width: 1199px)",
            isDesktop: "(min-width: 1200px)"
          },
          (ctx: { conditions?: { isMobile?: boolean; isTablet?: boolean; isDesktop?: boolean } }) => {
            const { isTablet, isDesktop } = ctx.conditions ?? {};
            const cfg = isDesktop ? DESKTOP_HERO_CFG : isTablet ? TABLET_HERO_CFG : MOBILE_HERO_CFG;
            const heroTimeline = buildHeroTimeline(gsap, cfg);

            ScrollTrigger.create({
              trigger: ".hero-scene",
              start: "top top",
              end: () => `+=${window.innerHeight * 4.5}`,
              scrub: 1,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              animation: heroTimeline
            });
          }
        );

        function pinHorizontalTrack(trackSelector: string, triggerSelector: string, panelSelector?: string) {
          const el = document.querySelector<HTMLElement>(trackSelector);
          if (!el) {
            return;
          }

          const panels = panelSelector
            ? Array.from(document.querySelectorAll<HTMLElement>(panelSelector))
            : [];

          gsap.to(el, {
            x: () => {
              const distance = el.scrollWidth - window.innerWidth;
              return distance > 0 ? -distance : 0;
            },
            ease: "none",
            onUpdate: () => {
              // Active-category dominance: whichever panel is nearest the viewport
              // center reads large/sharp/bright; the rest recede — camera travel
              // through an exhibition, not an equal-card carousel.
              if (panels.length === 0) {
                return;
              }

              const viewportCenter = window.innerWidth / 2;
              for (const panel of panels) {
                const rect = panel.getBoundingClientRect();
                const panelCenter = rect.left + rect.width / 2;
                const distance = Math.abs(panelCenter - viewportCenter);
                const proximity = 1 - Math.min(distance / (window.innerWidth * 0.75), 1);
                gsap.set(panel, {
                  scale: 0.84 + proximity * 0.16,
                  opacity: 0.45 + proximity * 0.55,
                  filter: `blur(${(1 - proximity) * 2.6}px)`
                });
              }
            },
            scrollTrigger: {
              trigger: triggerSelector,
              start: "top top",
              end: () => `+=${Math.max(el.scrollWidth, window.innerHeight)}`,
              scrub: 0.9,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true
            }
          });
        }

        pinHorizontalTrack(".exhibition-track", ".exhibition-gallery", ".exhibition-panel");
        pinHorizontalTrack(".world-track", ".product-world");

        gsap.to(".world-panel-forward .world-panel-figure", {
          scale: 1.15,
          ease: "none",
          scrollTrigger: {
            trigger: ".product-world",
            start: "top top",
            end: "bottom top",
            scrub: 0.8
          }
        });

        if (document.querySelector(".ingredient-story")) {
          const ingredientTl = gsap.timeline();

          ingredientTl
            .to(".ingredient-word.word-natural", { opacity: 1, duration: 10 }, 5)
            .to(".ingredient-word.word-natural", { opacity: 0, duration: 8 }, 20)
            .to(
              ".ingredient-leaf.leaf-a",
              { x: "0%", opacity: 0.9, duration: 22, ease: "power1.inOut" },
              10
            )
            .to(".ingredient-word.word-gentle", { opacity: 1, duration: 10 }, 35)
            .to(".ingredient-word.word-gentle", { opacity: 0, duration: 8 }, 50)
            .to(
              ".ingredient-leaf.leaf-b",
              { x: "0%", opacity: 0.9, duration: 22, ease: "power1.inOut" },
              40
            )
            .to(
              ".ingredient-product",
              { x: "-6%", scale: 1.08, rotate: -3, duration: 20, ease: "power1.inOut" },
              65
            )
            .to(".ingredient-word.word-intimate", { opacity: 1, duration: 12 }, 72);

          ScrollTrigger.create({
            trigger: ".ingredient-story",
            start: "top top",
            end: () => `+=${window.innerHeight * 2.2}`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            animation: ingredientTl
          });
        }
      }, rootRef);
    }

    void loadMotion();

    return () => {
      active = false;
      context?.revert();
    };
  }, []);

  return (
    <div className="cinematic-storefront" ref={rootRef}>
      <StorefrontNav />

      <main>
        <section className="hero-scene" aria-labelledby="home-hero-title">
          <video
            ref={heroVideoRef}
            className="hero-scene-video"
            aria-hidden="true"
            autoPlay
            loop
            muted
            playsInline
            poster={`/hero/video/ohmykitty-hero-poster.jpg?v=${HERO_VIDEO_VERSION}`}
          >
            <source src={`/hero/video/ohmykitty-hero.mp4?v=${HERO_VIDEO_VERSION}`} type="video/mp4" />
          </video>
          <div className="hero-scene-scrim" aria-hidden="true" />

          <div className="hero-scene-copy">
            <span className="scene-kicker">Oh My Kitty</span>
            <h1 id="home-hero-title">Intimate care.</h1>
            <p className="hero-scene-script">Naturally.</p>
            <div className="hero-scene-actions">
              <Link className="portal-cta" href="/shop">
                <span>Shop care</span>
                <i aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="hero-scene-stage" aria-hidden="true">
            <div className="hero-scene-portal">
              <Image alt="" fill sizes="460px" src="/hero/architecture/peach-portal.svg" />
            </div>

            <div className="hero-scene-pouch">
              <Image alt="" fill sizes="220px" src="/hero/products/infection-flusher.png" />
            </div>

            <div className="hero-scene-bottle">
              <Image alt="" fill priority sizes="260px" src="/hero/products/slippery-elm.png" />
            </div>

            <div className="hero-scene-petals petals-a">
              <Image alt="" fill sizes="92px" src="/hero/botanicals/petals.svg" />
            </div>
            <div className="hero-scene-petals petals-b">
              <Image alt="" fill sizes="60px" src="/hero/botanicals/petals.svg" />
            </div>

            <div className="hero-scene-leaf leaf-left">
              <Image alt="" fill sizes="210px" src="/hero/botanicals/leaf-foreground-01.svg" />
            </div>
            <div className="hero-scene-leaf leaf-right">
              <Image alt="" fill sizes="170px" src="/hero/botanicals/leaf-midground-01.svg" />
            </div>

            <span className="hero-scene-microcopy">Natural</span>

            <div className="hero-scene-blackworld" />

            <div className="hero-scene-copy-black">
              <h2>Care differently.</h2>
            </div>
          </div>

          <div className="hero-scroll-cue" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </section>

        <section className="exhibition-gallery" aria-label="Shop by category">
          <div className="exhibition-arch" aria-hidden="true">
            <Image alt="" fill sizes="900px" src="/hero/architecture/peach-portal.svg" />
          </div>
          <div className="exhibition-botanical exhibition-botanical-a" aria-hidden="true">
            <Image alt="" fill sizes="180px" src="/hero/botanicals/leaf-foreground-01.svg" />
          </div>
          <div className="exhibition-botanical exhibition-botanical-b" aria-hidden="true">
            <Image alt="" fill sizes="200px" src="/hero/botanicals/leaf-midground-01.svg" />
          </div>
          <div className="exhibition-track">
            {categories.map((category, index) => {
              const variant = EXHIBITION_VARIANT_CYCLE[index % EXHIBITION_VARIANT_CYCLE.length];

              return (
                <Link
                  className="exhibition-panel"
                  data-variant={variant}
                  href={`/categories/${category.slug}` as Route}
                  key={category.id}
                >
                  {variant === "c" ? (
                    <span className="exhibition-panel-type" aria-hidden="true">
                      {category.title}
                    </span>
                  ) : null}
                  <div className="exhibition-panel-figure" aria-hidden="true">
                    {category.imageUrl ? (
                      <Image alt="" fill sizes="320px" src={category.imageUrl} />
                    ) : null}
                  </div>
                  <div className="exhibition-panel-copy">
                    <span>
                      {category.productCount} {category.productCount === 1 ? "product" : "products"}
                    </span>
                    <h2>{category.title}</h2>
                  </div>
                </Link>
              );
            })}
            <Link className="exhibition-panel exhibition-finale" data-variant="e" href="/shop">
              <div className="exhibition-panel-copy">
                <span>Full catalogue</span>
                <h2>Shop now.</h2>
                <p>The full immersive shopping experience.</p>
              </div>
            </Link>
          </div>
        </section>

        {worldProducts.length > 0 ? (
          <section className="product-world" aria-label="Explore the range">
            <div className="world-dissolve" aria-hidden="true" />
            <div className="world-track">
              <div className="world-intro">
                <span className="scene-kicker">Exhibition</span>
                <h2>The range, up close.</h2>
              </div>
              {worldProducts.map((product, index) => {
                const tile = WORLD_TILE_CYCLE[index % WORLD_TILE_CYCLE.length];
                const isForward = tile === "wide";

                return (
                  <Link
                    className={`world-panel world-panel-${tile} ${isForward ? "world-panel-forward" : ""}`}
                    href={`/products/${product.slug}` as Route}
                    key={product.variantId}
                  >
                    <div className="world-panel-figure" aria-hidden="true">
                      {product.imageUrl ? (
                        <Image alt="" fill sizes="360px" src={product.imageUrl} />
                      ) : null}
                    </div>
                    <div className="world-panel-copy">
                      <span>{product.primaryCategory}</span>
                      <h3>{product.title}</h3>
                      <strong>{product.formattedPrice}</strong>
                    </div>
                  </Link>
                );
              })}
              <div className="world-botanical world-botanical-a" aria-hidden="true">
                <Image alt="" fill sizes="150px" src="/hero/botanicals/leaf-midground-01.svg" />
              </div>
              <div className="world-botanical world-botanical-b" aria-hidden="true">
                <Image alt="" fill sizes="110px" src="/hero/botanicals/petals.svg" />
              </div>
            </div>
          </section>
        ) : null}

        {ingredientProduct ? (
          <section className="ingredient-story" aria-label={`The story of ${ingredientProduct.title}`}>
            <div className="ingredient-stage">
              <div className="ingredient-glow" aria-hidden="true" />
              {ingredientProduct.imageUrl ? (
                <div className="ingredient-product">
                  <Image alt="" fill sizes="320px" src={ingredientProduct.imageUrl} />
                </div>
              ) : null}
              <div className="ingredient-leaf leaf-a" aria-hidden="true">
                <Image alt="" fill sizes="220px" src="/hero/botanicals/leaf-foreground-01.svg" />
              </div>
              <div className="ingredient-leaf leaf-b" aria-hidden="true">
                <Image alt="" fill sizes="180px" src="/hero/botanicals/leaf-midground-01.svg" />
              </div>
              <span className="ingredient-word word-natural">Natural.</span>
              <span className="ingredient-word word-gentle">Gentle.</span>
              <span className="ingredient-word word-intimate">Intimate.</span>
            </div>
          </section>
        ) : null}

        {dominantSeller ? (
          <section className="best-sellers" aria-label="Best sellers">
            <div className="best-sellers-heading">
              <span className="scene-kicker">Shop the ritual</span>
              <h2>Loved on repeat.</h2>
            </div>
            <div className="best-sellers-stage">
              <article className="best-seller-dominant">
                <Link className="best-seller-dominant-hit" href={`/products/${dominantSeller.slug}` as Route}>
                  <div className="best-seller-figure" aria-hidden="true">
                    {dominantSeller.imageUrl ? (
                      <Image alt="" fill sizes="420px" src={dominantSeller.imageUrl} />
                    ) : null}
                  </div>
                  <div className="best-seller-copy">
                    <span>{dominantSeller.primaryCategory}</span>
                    <h3>{dominantSeller.title}</h3>
                    <strong>{dominantSeller.formattedPrice}</strong>
                  </div>
                </Link>
                <button
                  aria-label={`Quick add ${dominantSeller.title} to cart`}
                  className="quick-add-button"
                  onClick={() => {
                    addLineToCart(toCartLine(dominantSeller));
                    openCart();
                  }}
                  type="button"
                >
                  +
                </button>
              </article>
              {peekingSellers.length > 0 ? (
                <div className="best-seller-peek">
                  {peekingSellers.map((product) => (
                    <Link
                      className="best-seller-peek-card"
                      href={`/products/${product.slug}` as Route}
                      key={product.variantId}
                    >
                      <div className="best-seller-figure small" aria-hidden="true">
                        {product.imageUrl ? (
                          <Image alt="" fill sizes="160px" src={product.imageUrl} />
                        ) : null}
                      </div>
                      <span>{product.title}</span>
                      <strong>{product.formattedPrice}</strong>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="social-proof" aria-label="Customer reviews">
          <span className="scene-kicker">In her words</span>
          <div className="review-fragments">
            {reviewAccentA?.imageUrl ? (
              <div className="review-fragment-figure figure-a" aria-hidden="true">
                <Image alt="" fill sizes="120px" src={reviewAccentA.imageUrl} />
              </div>
            ) : null}
            {reviewAccentB?.imageUrl ? (
              <div className="review-fragment-figure figure-b" aria-hidden="true">
                <Image alt="" fill sizes="120px" src={reviewAccentB.imageUrl} />
              </div>
            ) : null}
            {SAMPLE_REVIEWS.map((review) => (
              <article className="review-fragment" key={review.initials}>
                <div className="review-stars" aria-hidden="true">
                  ★★★★★
                </div>
                <p>&ldquo;{review.quote}&rdquo;</p>
                <span>— {review.initials}</span>
              </article>
            ))}
          </div>
        </section>
      </main>

      <div className="shop-control" aria-label="Quick shopping controls">
        <Link href="/shop">Shop</Link>
        <span className="dot" aria-hidden="true" />
        <CartTrigger>
          <CartCount />
        </CartTrigger>
      </div>
    </div>
  );
}

function toCartLine(product: StorefrontProductView): CartLine {
  return {
    productId: product.id,
    productTitle: product.title,
    quantity: 1,
    sku: product.sku,
    unitPrice: product.price,
    variantId: product.variantId,
    variantTitle: product.variantTitle,
    imageUrl: product.imageUrl
  };
}
