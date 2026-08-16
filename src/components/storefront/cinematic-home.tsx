"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { CartCount } from "@/components/storefront/cart-count";
import type { StorefrontProductView } from "@/lib/storefront/catalogue";

type CinematicHomeProps = {
  products: StorefrontProductView[];
};

export function CinematicHome({ products }: CinematicHomeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroProducts = products.slice(0, 3);
  const featuredProduct = heroProducts[0];

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
        gsap.to(".cinematic-hero", {
          "--hero-progress": 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".cinematic-hero",
            start: "top top",
            end: "bottom top",
            scrub: 0.8
          }
        });

        gsap.to(".hero-product.primary", {
          yPercent: -16,
          rotate: -2,
          scale: 1.04,
          ease: "none",
          scrollTrigger: {
            trigger: ".cinematic-hero",
            start: "top top",
            end: "bottom top",
            scrub: 0.8
          }
        });

        gsap.to(".hero-product.left", {
          xPercent: -18,
          yPercent: 8,
          rotate: -8,
          ease: "none",
          scrollTrigger: {
            trigger: ".cinematic-hero",
            start: "top top",
            end: "bottom top",
            scrub: 0.8
          }
        });

        gsap.to(".hero-product.right", {
          xPercent: 18,
          yPercent: -10,
          rotate: 9,
          ease: "none",
          scrollTrigger: {
            trigger: ".cinematic-hero",
            start: "top top",
            end: "bottom top",
            scrub: 0.8
          }
        });

        const track = document.querySelector<HTMLElement>(".spatial-track");
        if (track) {
          gsap.to(track, {
            x: () => {
              const distance = track.scrollWidth - window.innerWidth;
              return distance > 0 ? -distance : 0;
            },
            ease: "none",
            scrollTrigger: {
              trigger: ".spatial-gallery",
              start: "top top",
              end: () => `+=${Math.max(track.scrollWidth, window.innerHeight)}`,
              scrub: 0.9,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true
            }
          });
        }

        gsap.fromTo(
          ".portal-window",
          { clipPath: "circle(14% at 50% 50%)" },
          {
            clipPath: "circle(78% at 50% 50%)",
            ease: "none",
            scrollTrigger: {
              trigger: ".portal-scene",
              start: "top 72%",
              end: "bottom 40%",
              scrub: 0.8
            }
          }
        );
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
      <nav className="storefront-nav glass" aria-label="Storefront">
        <Link className="store-brand" href="/">
          <Image
            src="/brand/oh-my-kitty-logo.jpeg"
            alt="Oh My Kitty logo"
            width={38}
            height={38}
            priority
          />
          <span>Oh My Kitty</span>
        </Link>
        <Link className="bag-pill" href="/cart">
          <CartCount />
        </Link>
      </nav>

      <main>
        <section className="cinematic-hero" aria-labelledby="home-hero-title">
          <div className="hero-atmosphere" aria-hidden="true">
            <div className="depth-arch back" />
            <div className="depth-arch front" />
            <div className="botanical-mark one" />
            <div className="botanical-mark two" />
          </div>

          <div className="hero-product-stage" aria-hidden="true">
            <ProductFigure product={heroProducts[1] ?? featuredProduct} position="left" />
            <ProductFigure product={featuredProduct} position="primary" />
            <ProductFigure
              product={heroProducts[2] ?? heroProducts[1] ?? featuredProduct}
              position="right"
            />
          </div>

          <div className="hero-copy">
            <span className="scene-kicker">Best & Biggest</span>
            <h1 id="home-hero-title">Oh My Kitty</h1>
            <p>Intimate care, softly staged.</p>
            <Link className="portal-cta" href="/shop">
              <span>Shop care</span>
              <i aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="spatial-gallery" aria-label="Featured products">
          <div className="spatial-track">
            {products.map((product) => (
              <article className={`spatial-panel ${product.tone}`} key={product.variantId}>
                <ProductFigure product={product} position="panel" />
                <div>
                  <span>{product.variantTitle}</span>
                  <h2>{product.title}</h2>
                  <p>{product.shortCopy}</p>
                  <strong>{product.formattedPrice}</strong>
                </div>
              </article>
            ))}
            <article className="spatial-panel black">
              <div className="checkout-path" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div>
                <span>Bag</span>
                <h2>Simple checkout.</h2>
                <p>Cart, delivery, payment, confirmation.</p>
                <Link href="/cart">View bag</Link>
              </div>
            </article>
          </div>
        </section>

        <section className="portal-scene">
          <div className="portal-window">
            <Image
              src="/brand/oh-my-kitty-logo.jpeg"
              alt="Oh My Kitty logo"
              width={260}
              height={260}
            />
            <div>
              <span className="scene-kicker">Daily care</span>
              <h2>Soft, clean, ready.</h2>
              <Link className="portal-link inverted" href="/shop">
                Enter shop
              </Link>
            </div>
          </div>
        </section>
      </main>

      <div className="shop-control" aria-label="Quick shopping controls">
        <Link href="/shop">Shop</Link>
        <span className="dot" aria-hidden="true" />
        <Link href="/cart">
          <CartCount />
        </Link>
      </div>
    </div>
  );
}

function ProductFigure({
  position,
  product
}: {
  position: "left" | "primary" | "right" | "panel";
  product?: StorefrontProductView;
}) {
  return (
    <div className={`hero-product ${position}`}>
      <div className="product-bottle">
        <Image
          src="/brand/oh-my-kitty-logo.jpeg"
          alt=""
          width={88}
          height={88}
          aria-hidden="true"
        />
        <span>{product?.title ?? "Oh My Kitty"}</span>
      </div>
      <div className="product-shadow" />
    </div>
  );
}
