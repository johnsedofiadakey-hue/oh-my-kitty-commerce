"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import { addLineToCart, type CartLine } from "@/components/storefront/add-to-bag-button";
import { CartCount } from "@/components/storefront/cart-count";
import { CartTrigger } from "@/components/storefront/cart-trigger";
import { BagIcon } from "@/components/storefront/icons";
import { openCart } from "@/lib/storefront/cart-store";
import type { StorefrontProductView } from "@/lib/storefront/catalogue";

type MatrixHomeProps = {
  products: StorefrontProductView[];
  sourceMessage?: string;
};

const careNeeds = [
  { title: "Freshness", subtitle: "Everyday ritual", eyebrow: "FOR EVERYDAY CONFIDENCE", match: /mist|wash|oil|fresh/i, notes: ["pH balance", "Daily wash", "On-the-go mist"] },
  { title: "Targeted care", subtitle: "Focused support", eyebrow: "FOR WHEN YOU NEED MORE", match: /infection|boric|set|herb/i, notes: ["Care sets", "Boric support", "Herbal care"] },
  { title: "Wellness", subtitle: "From within", eyebrow: "FOR YOUR EVERYDAY RHYTHM", match: /supplement|elm|sobolo|libido|wellness/i, notes: ["Supplements", "Botanical care", "Feel-good rituals"] },
  { title: "Body care", subtitle: "Comfort & tone", eyebrow: "FOR FEELING COMFORTABLE", match: /thigh|razor|bump|body/i, notes: ["Tone care", "Shaving care", "Soft skin"] }
] as const;

const trustedMarks = [
  { label: "FDA Ghana", detail: "registration check", tone: "fda", href: "https://verifypermit.fdaghana.gov.gh/publicsearch", logo: "/brand/fda-ghana-logo.png" },
  { label: "Days for Girls", detail: "period dignity", tone: "dfg", href: null, logo: "/brand/days-for-girls-logo.png" },
  { label: "Paystack", detail: "secure payments", tone: "paystack", href: "https://paystack.com", logo: "/brand/paystack-logo.png" },
  { label: "Stormglide.io", detail: "digital experience", tone: "stormglide", href: "https://stormglide.io", logo: "/brand/stormglide-logo.jpg" }
] as const;

/**
 * Homepage-only presentation layer. It deliberately consumes the existing
 * storefront product view so catalogue, price, availability, cart, and route
 * behavior remain owned by the established commerce system.
 */
export function MatrixHome({ products, sourceMessage }: MatrixHomeProps) {
  const [activeNeed, setActiveNeed] = useState(0);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const homeRef = useRef<HTMLDivElement>(null);
  const heroPointerStart = useRef<number | null>(null);
  const didSwipeHero = useRef(false);

  useEffect(() => {
    const home = homeRef.current;
    if (!home) return;

    const scenes = Array.from(home.querySelectorAll<HTMLElement>(".matrix-home-motion-reveal"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      scenes.forEach((scene) => scene.classList.add("is-visible"));
      return;
    }

    home.classList.add("is-motion-ready");
    // A masked scene is intentionally invisible before it arrives, so an
    // IntersectionObserver cannot always see it. The small, one-way scroll
    // check is more reliable here: it triggers the reveal just before each
    // scene reaches the primary part of the viewport, then never does work
    // for that scene again.
    const revealScenes = () => {
      const revealLine = window.innerHeight * 0.92;
      scenes.forEach((scene) => {
        if (scene.classList.contains("is-visible")) return;
        const bounds = scene.getBoundingClientRect();
        if (bounds.top < revealLine && bounds.bottom > 0) {
          scene.classList.add("is-visible");
        }
      });
    };

    window.addEventListener("scroll", revealScenes, { passive: true });
    window.addEventListener("resize", revealScenes);
    window.requestAnimationFrame(revealScenes);
    return () => {
      window.removeEventListener("scroll", revealScenes);
      window.removeEventListener("resize", revealScenes);
    };
  }, []);
  const sellableProducts = useMemo(
    () => products.filter((product) => product.stockAvailable > 0 && product.imageUrl),
    [products]
  );
  const bestSellers = useMemo(
    () => sellableProducts.filter((product) => product.bestSeller),
    [sellableProducts]
  );
  const transparentProducts = sellableProducts.filter((product) => Boolean(heroCutoutSource(product)));
  // The Boric Acid source—and the routine image that prominently includes
  // that bottle—remain available in the catalogue, but are not strong enough
  // for the homepage's oversized editorial stages.
  const homepageVisualProducts = transparentProducts.filter((product) => {
    const key = heroCutoutKey(product);
    return key !== "boric" && key !== "chronic";
  });
  const selectStageProducts = (...keys: string[]) =>
    keys
      .map((key) => homepageVisualProducts.find((product) => heroCutoutKey(product) === key))
      .filter((product): product is StorefrontProductView => Boolean(product));
  // These scenes deliberately use the clean, single-product cutouts. Bundles
  // remain in the shop rail, where their contents can be read properly.
  const mistProduct = selectStageProducts("mist")[0];
  const flusherProduct = selectStageProducts("flusher")[0];
  const heroCampaignSlides = [
    { key: "wash", product: selectStageProducts("wash")[0], label: "Feminine Wash" },
    { key: "mist", product: mistProduct, label: "Kitty Mist" },
    { key: "body", product: selectStageProducts("body")[0], label: "Body Care" }
  ].filter((slide): slide is { key: string; product: StorefrontProductView; label: string } => Boolean(slide.product));
  const activeHeroCampaign = heroCampaignSlides[activeHeroSlide] ?? heroCampaignSlides[0];
  const featuredProducts = (bestSellers.filter((product) => homepageVisualProducts.includes(product)).length
    ? bestSellers.filter((product) => homepageVisualProducts.includes(product))
    : homepageVisualProducts
  ).slice(0, 6);
  const activeNeedData = careNeeds[activeNeed] ?? careNeeds[0];
  const needProducts = sellableProducts.filter((product) => activeNeedData.match.test(`${product.title} ${product.tags.join(" ")}`)).slice(0, 4);
  const recommendedProducts = needProducts.length ? needProducts : featuredProducts.slice(0, 4);
  const activeNeedProduct = recommendedProducts.find((product) => homepageVisualProducts.includes(product)) ?? featuredProducts[0];

  useEffect(() => {
    if (heroCampaignSlides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroCampaignSlides.length);
    }, 6200);

    return () => window.clearInterval(timer);
  }, [heroCampaignSlides.length]);

  const showHeroSlide = (index: number) => {
    if (!heroCampaignSlides.length) return;
    setActiveHeroSlide((index + heroCampaignSlides.length) % heroCampaignSlides.length);
  };

  const handleHeroPointerDown = (clientX: number) => {
    heroPointerStart.current = clientX;
    didSwipeHero.current = false;
  };

  const handleHeroPointerUp = (clientX: number) => {
    const start = heroPointerStart.current;
    heroPointerStart.current = null;
    if (start === null || Math.abs(clientX - start) < 36 || heroCampaignSlides.length < 2) return;

    didSwipeHero.current = true;
    showHeroSlide(activeHeroSlide + (clientX < start ? 1 : -1));
  };

  return (
    <div className="matrix-home" ref={homeRef}>
      <header className="matrix-home-header">
        <Link className="matrix-home-brand" href="/">
          <span className="matrix-home-brand-mark">OMK</span>
          <span>
            <strong>Oh My Kitty</strong>
            <small>intimate care</small>
          </span>
        </Link>
        <div className="matrix-home-header-actions">
          <Link className="matrix-home-shop-link" href="/shop">
            Shop
          </Link>
          <CartTrigger ariaLabel="View cart" className="matrix-home-cart">
            <BagIcon />
            <span className="matrix-home-cart-label">Bag</span>
            <b>
              <CartCount variant="text" />
            </b>
          </CartTrigger>
        </div>
      </header>

      <main>
        <section className="omk-monument-hero" aria-labelledby="matrix-home-title">
          <div className="omk-monument-stage">
          <div aria-hidden="true" className="omk-monument-backdrop">
            <Image alt="" fill priority sizes="100vw" src="/hero/editorial/omk-kitty-shelf-stage-v1.png" />
          </div>
          {heroCampaignSlides.length ? (
            <div className="omk-monument-products" aria-label="Featured products">
              {heroCampaignSlides.map((slide, index) => (
                <Link
                  aria-hidden={activeHeroSlide !== index}
                  aria-label={`View ${slide.product.title}`}
                  className={`omk-monument-product ${activeHeroSlide === index ? "is-active" : ""}`}
                  href={`/products/${slide.product.slug}` as Route}
                  key={slide.key}
                  onClick={(event) => {
                    if (!didSwipeHero.current) return;
                    event.preventDefault();
                    didSwipeHero.current = false;
                  }}
                  onFocus={() => showHeroSlide(index)}
                  onPointerDown={(event) => handleHeroPointerDown(event.clientX)}
                  onPointerUp={(event) => handleHeroPointerUp(event.clientX)}
                  tabIndex={activeHeroSlide === index ? 0 : -1}
                >
                  <Image alt={slide.product.imageAlt ?? slide.product.title} className={`omk-monument-pack omk-monument-pack-${slide.key}`} fill priority={index === 0} sizes="(max-width: 719px) 100vw, 52vw" src={heroCutoutSource(slide.product) ?? slide.product.imageUrl} />
                </Link>
              ))}
              <div className="omk-monument-controls" aria-label="Browse featured products">
                <button
                  aria-label="Show previous product"
                  className="omk-monument-step omk-monument-step-previous"
                  onClick={() => showHeroSlide(activeHeroSlide - 1)}
                  type="button"
                >
                  <span aria-hidden="true">←</span>
                </button>
                <div className="omk-monument-pagination" aria-label="Choose featured product">
                {heroCampaignSlides.map((slide, index) => (
                  <button
                    aria-label={`Show ${slide.label}`}
                    aria-pressed={activeHeroSlide === index}
                    className={activeHeroSlide === index ? "is-active" : undefined}
                    key={slide.key}
                    onPointerDown={() => showHeroSlide(index)}
                    onClick={() => showHeroSlide(index)}
                    type="button"
                  />
                ))}
                </div>
                <button
                  aria-label="Show next product"
                  className="omk-monument-step omk-monument-step-next"
                  onClick={() => showHeroSlide(activeHeroSlide + 1)}
                  type="button"
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          ) : null}
          <div className="omk-monument-copy">
            <div className="omk-monument-copy-inner" key={activeHeroCampaign?.key ?? "care"}>
              <span className="omk-monument-brandline">OH MY KITTY <i aria-hidden="true">/</i> INTIMATE CARE</span>
              <span className="matrix-home-eyebrow">{activeHeroCampaign ? heroCampaignCue(activeHeroCampaign.product) : "OH MY KITTY / INTIMATE CARE"}</span>
              <h1 id="matrix-home-title">{activeHeroCampaign?.label ?? "Care, made personal."}</h1>
              <p>{activeHeroCampaign?.product.shortCopy ?? "Thoughtful intimate care and wellness essentials."}</p>
              {activeHeroCampaign ? <span className="omk-monument-meta">{activeHeroCampaign.product.variantTitle} <i aria-hidden="true">•</i> {activeHeroCampaign.product.formattedPrice}</span> : null}
              <div className="omk-monument-actions">
                <Link className="matrix-home-button omk-monument-cta" href="/shop">
                  Shop now <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </div>
          </div>
        </section>

        {sourceMessage ? <p className="matrix-home-source-note">{sourceMessage}</p> : null}

        <section className="matrix-home-duality matrix-home-motion-reveal" aria-labelledby="matrix-home-duality-title">
          <div className="matrix-home-duality-heading">
            <span className="matrix-home-eyebrow">ONE RITUAL, TWO MOMENTS</span>
            <h2 id="matrix-home-duality-title">One ritual.<br />Two moments.</h2>
          </div>
          <div className="matrix-home-duality-panels">
            <article className="matrix-home-duality-panel matrix-home-duality-panel-dark">
              <div aria-hidden="true" className="matrix-home-world-backdrop">
                {mistProduct ? <ProductImage campaign cutout product={mistProduct} sizes="(max-width: 719px) 76vw, 360px" /> : null}
              </div>
              <span className="matrix-home-eyebrow">01 / DAILY</span>
              <h3>Everyday ease.</h3>
              <p>Gentle daily care for the rituals that keep you feeling like yourself.</p>
              <Link href="/shop">Explore daily care <span aria-hidden="true">↗</span></Link>
            </article>
            <div className="matrix-home-duality-connection" aria-hidden="true">
              <span className="matrix-home-duality-line" />
              <i>everyday</i><b>↔</b><i>when you need more</i>
            </div>
            <article className="matrix-home-duality-panel matrix-home-duality-panel-peach">
              <div aria-hidden="true" className="matrix-home-world-backdrop matrix-home-world-backdrop-targeted">
                {flusherProduct ? <ProductImage campaign cutout product={flusherProduct} sizes="(max-width: 719px) 76vw, 440px" /> : null}
              </div>
              <span className="matrix-home-eyebrow">02 / TARGETED</span>
              <h3>When you need more.</h3>
              <p>Thoughtful support for the moments that call for a little more care.</p>
              <Link href="/shop">Explore supportive care <span aria-hidden="true">↗</span></Link>
            </article>
          </div>
        </section>

        <section className="matrix-home-find matrix-home-motion-reveal" id="find-your-care" aria-labelledby="matrix-home-find-title">
          <div className="matrix-home-find-intro">
            <span className="matrix-home-eyebrow">FIND YOUR CARE</span>
            <h2 id="matrix-home-find-title">Care, made clearer.</h2>
            <p>Choose the moment you are shopping for. We will lead you to a thoughtful starting point.</p>
          </div>
          <div className="matrix-home-find-layout">
            <div className="matrix-home-find-list" role="tablist" aria-label="Choose a care need">
              {careNeeds.map((need, index) => (
                <button
                  aria-controls="matrix-home-find-result"
                  aria-selected={activeNeed === index}
                  className={activeNeed === index ? "is-active" : undefined}
                  key={need.title}
                  onClick={() => setActiveNeed(index)}
                  role="tab"
                  type="button"
                >
                  <small>0{index + 1}</small>
                  <span><b>{need.title}</b><em>{need.subtitle}</em></span>
                  <i aria-hidden="true">↗</i>
                </button>
              ))}
            </div>
            <aside className="matrix-home-find-result" id="matrix-home-find-result" role="tabpanel">
              <div className="matrix-home-find-content">
                <span aria-hidden="true" className="matrix-home-find-count">0{activeNeed + 1}</span>
                <span className="matrix-home-eyebrow">{activeNeedData.eyebrow}</span>
                <h3>{activeNeedData.title}</h3>
                <p>Thoughtful options selected for this part of your routine.</p>
                <div className="matrix-home-find-notes">
                  {activeNeedData.notes.map((note, index) => <span key={note}><b>0{index + 1}</b>{note}</span>)}
                </div>
                <div className="matrix-home-find-products" aria-label={`Recommended ${activeNeedData.title} products`}>
                  {recommendedProducts.slice(0, 2).map((product) => (
                    <Link href={`/products/${product.slug}` as Route} key={product.variantId}>
                      <span>{product.title}</span><b>{product.formattedPrice}</b><i aria-hidden="true">↗</i>
                    </Link>
                  ))}
                </div>
                <Link className="matrix-home-button matrix-home-button-dark" href="/shop">See products <span aria-hidden="true">↗</span></Link>
              </div>
              <div aria-hidden="true" className="matrix-home-find-campaign-shot">
                {activeNeedProduct ? <ProductImage campaign cutout product={activeNeedProduct} sizes="(max-width: 719px) 78vw, 440px" /> : null}
              </div>
            </aside>
          </div>
        </section>

        <section className="matrix-home-favourites matrix-home-motion-reveal" aria-labelledby="matrix-home-favourites-title">
          <div className="matrix-home-section-intro matrix-home-section-intro-row">
            <div>
              <span className="matrix-home-eyebrow">OUR TOP PRODUCTS</span>
              <h2 id="matrix-home-favourites-title">Shop the favourites.</h2>
            </div>
            <p>Real products, chosen by customers.</p>
          </div>
          {featuredProducts.length ? (
            <div className="matrix-home-product-rail">
              {featuredProducts.map((product, index) => (
                <article className="matrix-home-product-card" key={product.variantId}>
                  <Link href={`/products/${product.slug}` as Route}>
                    <span className="matrix-home-product-index">0{index + 1} / 0{featuredProducts.length}</span>
                    <ProductImage campaign cutout product={product} sizes="(max-width: 700px) 76vw, 410px" />
                  </Link>
                  <div className="matrix-home-product-copy">
                    <span>{product.variantTitle}</span>
                    <h3>{product.title}</h3>
                    <p>{product.shortCopy}</p>
                    <div>
                      <strong>{product.formattedPrice}</strong>
                      <button
                        aria-label={`Add ${product.title} to bag`}
                        onClick={() => addToBag(product)}
                        type="button"
                      >
                        Add <span aria-hidden="true">+</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="matrix-home-empty">We are refreshing the collection. Browse the full shop for what is available.</p>
          )}
        </section>

        <section className="matrix-home-edit matrix-home-motion-reveal" aria-labelledby="matrix-home-edit-title">
          <div className="matrix-home-edit-copy">
            <span className="matrix-home-eyebrow">THE OH MY KITTY EDIT</span>
            <h2 id="matrix-home-edit-title">Care, chosen with intention.</h2>
            <p>From quiet daily rituals to the moments when you need a little more care.</p>
            <div className="matrix-home-edit-marquee" aria-label="Shop by ritual">
              <div className="matrix-home-edit-track">
                {Array.from({ length: 4 }, (_, set) => careNeeds.map((need) => (
                  <span aria-hidden={set > 0 ? true : undefined} key={`${need.title}-${set}`}>{need.title}</span>
                )))}
              </div>
            </div>
            <Link className="matrix-home-text-link" href="/shop">Shop all products <span aria-hidden="true">↗</span></Link>
          </div>
          <div aria-hidden="true" className="matrix-home-edit-photo">
            <Image alt="" fill sizes="(max-width: 719px) 100vw, 50vw" src="/hero/editorial/omk-flower-ritual-v1.png" />
          </div>
        </section>

        <section className="matrix-home-partners" aria-label="Shopping and service partners">
          <span className="matrix-home-eyebrow">SHOP WITH CONFIDENCE</span>
          <div className="matrix-home-partners-marquee">
            <div className="matrix-home-partners-track">
              {Array.from({ length: 4 }, (_, set) => trustedMarks.map((mark) => {
                const className = `matrix-home-partner matrix-home-partner-${mark.tone}`;
                const content = <><Image alt={mark.label} className={`matrix-home-partner-logo matrix-home-partner-logo-${mark.tone}`} height={32} src={mark.logo} width={152} /><small>{mark.detail}</small></>;
                return mark.href && set === 0 ? (
                  <a className={className} href={mark.href} key={`${mark.label}-${set}`} rel="noreferrer" target="_blank">
                    {content}
                  </a>
                ) : (
                  <span aria-hidden={set > 0 ? true : undefined} className={className} key={`${mark.label}-${set}`}>
                    {content}
                  </span>
                );
              }))}
            </div>
          </div>
          <p>Registration can be checked with FDA Ghana. Selected partners supporting care, access, and a discreet checkout.</p>
        </section>

        <section className="matrix-home-closing" aria-labelledby="matrix-home-closing-title">
          <div aria-hidden="true" className="matrix-home-closing-halo" />
          <span className="matrix-home-eyebrow">OH MY KITTY</span>
          <h2 id="matrix-home-closing-title">Care differently.</h2>
          <p>Intimate wellness, considered.</p>
          <Link className="matrix-home-button matrix-home-button-light" href="/shop">
            Explore the shop <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </main>

    </div>
  );
}

function ProductImage({
  product,
  cutout = false,
  campaign = false,
  priority = false,
  sizes
}: {
  product: StorefrontProductView;
  cutout?: boolean;
  campaign?: boolean;
  priority?: boolean;
  sizes: string;
}) {
  const campaignSource = campaign ? campaignPhotoSource(product) : null;
  const source = campaignSource ?? (cutout ? heroCutoutSource(product) ?? product.imageUrl : product.imageUrl);
  const artKey = cutout ? heroCutoutKey(product) : null;

  if (!source) {
    return <div aria-hidden="true" className="matrix-home-product-placeholder" />;
  }

  return (
    <Image
      alt={product.imageAlt ?? product.title}
      className={campaignSource ? "matrix-home-campaign-product-photo" : artKey ? `matrix-home-cutout matrix-home-cutout-${artKey}` : undefined}
      fill
      priority={priority}
      sizes={sizes}
      src={source}
      style={{ objectFit: campaignSource ? "cover" : "contain" }}
    />
  );
}

function heroCampaignCue(product: StorefrontProductView) {
  const cues: Record<string, string> = {
    "feminine-wash": "DAILY CARE / pH BALANCED",
    "kitty-mist": "EVERYDAY FRESHNESS / EXTERNAL USE",
    "ph-balanced-kitty-mist": "EVERYDAY FRESHNESS / EXTERNAL USE",
    "intense-infection-flusher": "HERBAL WELLNESS / 12 TEA BAGS",
    "intense-infection-flusher-herbs": "HERBAL WELLNESS / 12 TEA BAGS",
    "dark-inner-thigh-set": "BODY CARE / OIL + CREAM"
  };

  return cues[product.slug] ?? "OH MY KITTY / INTIMATE CARE";
}

/**
 * The current live product photographs include framed photo exports. These
 * verified local PNGs already contain alpha, so the hero can use true pack
 * cutouts while every product card elsewhere continues to show its catalogue
 * image exactly as uploaded by the client.
 */
function heroCutoutSource(product: StorefrontProductView) {
  const sources: Record<string, { source: string; key: string }> = {
    "chronic-infection-set": { source: "/products/chronic-infection-set.png", key: "chronic" },
    "intense-infection-flusher": { source: "/products/intense-infection-flusher-herbs.png", key: "flusher" },
    "intense-infection-flusher-herbs": { source: "/products/intense-infection-flusher-herbs.png", key: "flusher" },
    "boric-acid": { source: "/products/boric-acid-suppositories-crop-v2.png", key: "boric" },
    "boric-acid-big": { source: "/products/boric-acid-suppositories-crop-v2.png", key: "boric" },
    "kitty-mist": { source: "/products/ph-balanced-kitty-mist.png", key: "mist" },
    "ph-balanced-kitty-mist": { source: "/products/ph-balanced-kitty-mist.png", key: "mist" },
    "feminine-wash": { source: "/products/feminine-wash.png", key: "wash" },
    "dark-inner-thigh-set": { source: "/products/dark-inner-thigh-set.png", key: "body" }
  };

  return sources[product.slug]?.source;
}

function heroCutoutKey(product: StorefrontProductView) {
  const keys: Record<string, string> = {
    "chronic-infection-set": "chronic",
    "intense-infection-flusher": "flusher",
    "intense-infection-flusher-herbs": "flusher",
    "boric-acid": "boric",
    "boric-acid-big": "boric",
    "kitty-mist": "mist",
    "ph-balanced-kitty-mist": "mist",
    "feminine-wash": "wash",
    "dark-inner-thigh-set": "body"
  };

  return keys[product.slug];
}

function campaignPhotoSource(product: StorefrontProductView) {
  const sources: Record<string, string> = {
    "chronic-infection-set": "/hero/products/chronic-infection-set-campaign-v1.png",
    "feminine-wash": "/hero/products/feminine-wash-campaign-v1.png",
    "kitty-mist": "/hero/products/kitty-mist-campaign-v1.png",
    "ph-balanced-kitty-mist": "/hero/products/kitty-mist-campaign-v1.png",
    "boric-acid": "/hero/products/boric-acid-campaign-v1.png",
    "boric-acid-big": "/hero/products/boric-acid-campaign-v1.png",
    "intense-infection-flusher": "/hero/products/infection-flusher-campaign-v1.png",
    "intense-infection-flusher-herbs": "/hero/products/infection-flusher-campaign-v1.png",
    "dark-inner-thigh-set": "/hero/products/dark-inner-thigh-campaign-v1.png"
  };

  return sources[product.slug];
}

function addToBag(product: StorefrontProductView) {
  const line: CartLine = {
    productId: product.id,
    productTitle: product.title,
    quantity: 1,
    sku: product.sku,
    unitPrice: product.price,
    variantId: product.variantId,
    variantTitle: product.variantTitle,
    imageUrl: product.imageUrl
  };
  addLineToCart(line);
  openCart();
}
