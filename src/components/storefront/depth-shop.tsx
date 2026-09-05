"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import {
  AddToBagButton,
  addLineToCart,
  type CartLine
} from "@/components/storefront/add-to-bag-button";
import { CartTrigger } from "@/components/storefront/cart-trigger";
import { StorefrontNav } from "@/components/storefront/storefront-nav";
import type { StorefrontProductView } from "@/lib/storefront/catalogue";
import { celebrateBurst } from "@/lib/storefront/celebrate";
import { openCart } from "@/lib/storefront/cart-store";
import { ShowcaseCard } from "@/components/storefront/showcase-card";
import { usePhotoBackdrop } from "@/lib/storefront/use-photo-backdrop";

type DepthShopProps = {
  products: StorefrontProductView[];
  sourceMessage?: string;
};

export function DepthShop({ products, sourceMessage }: DepthShopProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const { backgroundColor: sheetBackdrop, handleLoad: handleSheetLoad } = usePhotoBackdrop();

  const bestSellerProducts = useMemo(
    () =>
      products
        .filter((product) => product.bestSeller)
        .filter((product, index, all) => all.findIndex((entry) => entry.id === product.id) === index)
        .slice(0, 6),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return products;
    }

    return products.filter((product) =>
      [
        product.title,
        product.shortCopy,
        product.sku,
        product.variantTitle,
        ...product.concernLabels,
        ...product.productTypeLabels,
        ...product.routineLabels,
        ...product.tags
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [products, query]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.variantId === selectedId) ?? null,
    [products, selectedId]
  );

  const siblingVariants = useMemo(() => {
    if (!selectedProduct) {
      return [];
    }
    return products.filter((product) => product.id === selectedProduct.id);
  }, [products, selectedProduct]);

  // No shared taxonomy signal to match on (categories are gone, and
  // concern/product-type/routine tags aren't populated on real products
  // either) — best-sellers first, then just other products, is an honest
  // "you might also like" that actually shows something with real data.
  const relatedProducts = useMemo(() => {
    if (!selectedProduct) {
      return [];
    }
    const seenProductIds = new Set<string>();
    return products
      .filter((product) => {
        if (product.id === selectedProduct.id || seenProductIds.has(product.id)) {
          return false;
        }
        seenProductIds.add(product.id);
        return true;
      })
      .sort((first, second) => Number(second.bestSeller) - Number(first.bestSeller))
      .slice(0, 4);
  }, [products, selectedProduct]);

  const variantCountByProductId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.id, (counts.get(product.id) ?? 0) + 1);
    }
    return counts;
  }, [products]);
  const heroProducts = useMemo(
    () =>
      products
        .filter((product) => product.imageUrl)
        .filter((product, index, all) => all.findIndex((entry) => entry.id === product.id) === index)
        .slice(0, 3),
    [products]
  );

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
        gsap.from(".depth-product-card", {
          y: 42,
          opacity: 0,
          rotateX: 10,
          stagger: 0.08,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".depth-shop-grid",
            start: "top 78%"
          }
        });

        const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
        heroTimeline
          .from(".depth-shop-copy .scene-kicker", { y: 16, opacity: 0, duration: 0.5 })
          .from(
            ".depth-shop-copy h1 .word",
            { yPercent: 115, duration: 0.8, stagger: 0.07 },
            "-=0.25"
          )
          .from(".depth-shop-copy p", { y: 12, opacity: 0, duration: 0.5 }, "-=0.35");
      }, rootRef);
    }

    void loadMotion();

    return () => {
      active = false;
      context?.revert();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = selectedProduct ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedProduct]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedId(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <div className="depth-shop" ref={rootRef}>
      <StorefrontNav />

      <section className="depth-shop-hero">
        <div className="depth-shop-copy">
          <span className="scene-kicker">Shop</span>
          <h1>
            {"Shop your care.".split(" ").map((word, index) => (
              <span className="word-mask" key={word + index}>
                <span className="word">{word}&nbsp;</span>
              </span>
            ))}
          </h1>
          {sourceMessage ? <p>{sourceMessage}</p> : null}
        </div>
        {heroProducts.length > 0 ? <ShopBotanicalDrift products={heroProducts} /> : null}
      </section>

      {bestSellerProducts.length > 0 ? (
        <section className="related-products" aria-label="Best sellers">
          <div className="front-product-intro">
            <span className="scene-kicker">Best sellers</span>
            <h2>What everyone&apos;s reaching for.</h2>
          </div>
          <div className="showcase-grid">
            {bestSellerProducts.map((product) => (
              <ShowcaseCard key={product.variantId} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {products.length > 0 ? (
        <section className="shop-filter-bar" aria-label="Search products">
          <label className={`shop-search ${searchOpen ? "open" : ""}`}>
            <span aria-hidden="true">⌕</span>
            <input
              onBlur={() => setSearchOpen(false)}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="What are you looking for?"
              value={query}
            />
          </label>
        </section>
      ) : null}

      {products.length === 0 ? (
        <section className="shop-empty">
          <Image
            alt=""
            aria-hidden="true"
            className="shop-empty-mascot"
            height={72}
            src="/brand/oh-my-kitty-logo.jpeg"
            width={72}
          />
          <h2>We&apos;re restocking.</h2>
          <p>New products are on their way — check back soon.</p>
        </section>
      ) : filteredProducts.length > 0 ? (
        <section className="depth-shop-grid" aria-label="Products">
          {filteredProducts.map((product, index) => {
            const hasMultipleVariants = (variantCountByProductId.get(product.id) ?? 1) > 1;

            return (
              <ProductTile
                // Every 5th tile runs wide — a deliberate rest stop so the
                // grid reads as a considered layout rather than a uniform
                // wall of identical tiles.
                featured={index > 0 && (index + 1) % 5 === 0}
                hasMultipleVariants={hasMultipleVariants}
                key={product.variantId}
                onQuickAdd={() => {
                  if (hasMultipleVariants) {
                    setSelectedId(product.variantId);
                    return;
                  }
                  addLineToCart(toCartLine(product));
                  openCart();
                }}
                onSelect={() => setSelectedId(product.variantId)}
                product={product}
              />
            );
          })}
        </section>
      ) : (
        <section className="shop-empty">
          <Image
            alt=""
            aria-hidden="true"
            className="shop-empty-mascot"
            height={72}
            src="/brand/oh-my-kitty-logo.jpeg"
            width={72}
          />
          <h2>Nothing matched that yet.</h2>
          <p>Try clearing your search, or look for something else.</p>
          <button className="portal-cta" onClick={() => setQuery("")} type="button">
            <span>Show everything</span>
            <i aria-hidden="true" />
          </button>
        </section>
      )}

      {selectedProduct ? (
        <div
          className="product-sheet-backdrop"
          onClick={() => setSelectedId(null)}
          role="presentation"
        >
          <aside
            aria-labelledby="product-sheet-title"
            aria-modal="true"
            className="product-sheet"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button
              aria-label="Close product details"
              className="sheet-close"
              onClick={() => setSelectedId(null)}
              type="button"
            >
              <span aria-hidden="true">x</span>
            </button>
            <div
              className={`sheet-stage podium-surface ${selectedProduct.tone}`}
              aria-hidden="true"
              style={sheetBackdrop ? { backgroundColor: sheetBackdrop } : undefined}
            >
              <ProductPackshot product={selectedProduct} onImageLoad={handleSheetLoad} />
            </div>
            <div className="sheet-copy">
              {selectedProduct.bestSeller || !isDefaultVariant(selectedProduct) ? (
                <span>
                  {selectedProduct.bestSeller ? "Best seller" : ""}
                  {selectedProduct.bestSeller && !isDefaultVariant(selectedProduct) ? " / " : ""}
                  {!isDefaultVariant(selectedProduct) ? variantLabel(selectedProduct) : ""}
                </span>
              ) : null}
              <h2 id="product-sheet-title">{selectedProduct.title}</h2>
              <p>{selectedProduct.shortCopy}</p>
              <div className="sheet-meta">
                <div className="price-with-compare">
                  <strong>{selectedProduct.formattedPrice}</strong>
                  {selectedProduct.formattedCompareAtPrice ? (
                    <s>{selectedProduct.formattedCompareAtPrice}</s>
                  ) : null}
                </div>
              </div>
              {siblingVariants.length > 1 ? (
                <div className="size-pill-row">
                  <span className="size-pill-label">Size</span>
                  {siblingVariants.map((variant) => (
                    <button
                      className={`size-pill ${variant.variantId === selectedProduct.variantId ? "active" : ""}`}
                      key={variant.variantId}
                      onClick={() => setSelectedId(variant.variantId)}
                      type="button"
                    >
                      {variant.variantTitle}
                    </button>
                  ))}
                </div>
              ) : null}
              <AddToBagButton
                className="pdp-add-button"
                label="Add to bag"
                line={toCartLine(selectedProduct)}
              />
              <CartTrigger className="sheet-cart-link" onBeforeOpen={() => setSelectedId(null)}>
                View cart
              </CartTrigger>

              {relatedProducts.length > 0 ? (
                <div className="sheet-related">
                  <span className="sheet-related-label">You might also like</span>
                  <div className="sheet-related-row">
                    {relatedProducts.map((related) => (
                      <SheetRelatedCard
                        key={related.variantId}
                        onSelect={() => setSelectedId(related.variantId)}
                        product={related}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function ProductTile({
  featured,
  hasMultipleVariants,
  onQuickAdd,
  onSelect,
  product
}: {
  featured: boolean;
  hasMultipleVariants: boolean;
  onQuickAdd: () => void;
  onSelect: () => void;
  product: StorefrontProductView;
}) {
  const [added, setAdded] = useState(false);
  const { backgroundColor: tileBackdrop, handleLoad: handleTileLoad } = usePhotoBackdrop();

  return (
    <article className={`depth-product-card ${featured ? "featured" : ""}`}>
      <button className="depth-product-card-hit" onClick={onSelect} type="button">
        <div
          className="depth-product-stage"
          aria-hidden="true"
          style={tileBackdrop ? { backgroundColor: tileBackdrop } : undefined}
        >
          <ProductPackshot product={product} onImageLoad={handleTileLoad} />
        </div>
        <div className="depth-product-info">
          {product.bestSeller ? <span className="category-pill bestseller-pill">Best seller</span> : null}
          <h2>{product.title}</h2>
          <div className="price-with-compare">
            <strong>{product.formattedPrice}</strong>
            {product.formattedCompareAtPrice ? (
              <>
                <s>{product.formattedCompareAtPrice}</s>
                <span className="sale-pill">Sale</span>
              </>
            ) : null}
          </div>
        </div>
      </button>
      <button
        aria-label={
          hasMultipleVariants
            ? `Choose a size for ${product.title}`
            : `Quick add ${product.title} to bag`
        }
        className={`quick-add-button ${added ? "added" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          onQuickAdd();
          void celebrateBurst(event.currentTarget);
          if (!hasMultipleVariants) {
            setAdded(true);
            window.setTimeout(() => setAdded(false), 1300);
          }
        }}
        type="button"
      >
        {added ? "✓" : hasMultipleVariants ? "···" : "+"}
      </button>
    </article>
  );
}

function variantLabel(product: StorefrontProductView) {
  return isDefaultVariant(product) ? "Standard" : product.variantTitle;
}

function isDefaultVariant(product: StorefrontProductView) {
  return product.variantTitle.toLowerCase() === "default";
}

function ShopBotanicalDrift({ products }: { products: StorefrontProductView[] }) {
  return (
    <div className="depth-shop-botanical-drift" aria-hidden="true">
      <span className="shop-drift-aura" />
      <div className="shop-drift-leaf leaf-back">
        <Image alt="" fill sizes="220px" src="/hero/botanicals/leaf-midground-01.svg" />
      </div>
      <div className="shop-drift-leaf leaf-front">
        <Image alt="" fill sizes="240px" src="/hero/botanicals/leaf-foreground-01.svg" />
      </div>
      {products[1]?.imageUrl ? (
        <div className="shop-drift-product product-side">
          <Image alt="" fill sizes="220px" src={products[1].imageUrl} />
        </div>
      ) : null}
      {products[0]?.imageUrl ? (
        <div className="shop-drift-product product-main">
          <Image alt="" fill priority sizes="380px" src={products[0].imageUrl} />
        </div>
      ) : null}
      {products[2]?.imageUrl ? (
        <div className="shop-drift-product product-soft">
          <Image alt="" fill sizes="210px" src={products[2].imageUrl} />
        </div>
      ) : null}
    </div>
  );
}

function SheetRelatedCard({
  product,
  onSelect
}: {
  product: StorefrontProductView;
  onSelect: () => void;
}) {
  const { backgroundColor, handleLoad } = usePhotoBackdrop();

  return (
    <button className="sheet-related-card" onClick={onSelect} type="button">
      <div
        className="sheet-related-figure"
        aria-hidden="true"
        style={backgroundColor ? { background: backgroundColor } : undefined}
      >
        {product.imageUrl ? <Image alt="" fill onLoad={handleLoad} sizes="120px" src={product.imageUrl} /> : null}
      </div>
      <span>{product.title}</span>
      <strong>{product.formattedPrice}</strong>
    </button>
  );
}

function ProductPackshot({
  product,
  onImageLoad
}: {
  product: StorefrontProductView;
  onImageLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
}) {
  const [loaded, setLoaded] = useState(false);

  if (product.imageUrl) {
    return (
      <div className={`product-packshot photo-packshot ${loaded ? "" : "loading"}`}>
        <Image
          src={product.imageUrl}
          alt=""
          fill
          sizes="(max-width: 820px) calc(100vw - 80px), 430px"
          aria-hidden="true"
          onLoad={(event) => {
            setLoaded(true);
            onImageLoad?.(event);
          }}
        />
      </div>
    );
  }

  return (
    <div className="product-packshot">
      <Image
        src="/brand/oh-my-kitty-logo.jpeg"
        alt=""
        width={82}
        height={82}
        aria-hidden="true"
      />
      <span>{product.title}</span>
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
