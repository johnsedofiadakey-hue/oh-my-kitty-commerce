"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AddToBagButton,
  addLineToCart,
  type CartLine
} from "@/components/storefront/add-to-bag-button";
import { CartTrigger } from "@/components/storefront/cart-trigger";
import { StorefrontNav } from "@/components/storefront/storefront-nav";
import type { StorefrontProductView } from "@/lib/storefront/catalogue";
import { openCart } from "@/lib/storefront/cart-store";

type DepthShopProps = {
  products: StorefrontProductView[];
  sourceMessage?: string;
};

type DiscoveryOption = {
  slug: string;
  label: string;
};

export function DepthShop({ products, sourceMessage }: DepthShopProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const categoryOptions = useMemo<DiscoveryOption[]>(() => {
    const bySlug = new Map<string, string>();
    for (const product of products) {
      product.categorySlugs.forEach((slug, index) => {
        if (!bySlug.has(slug)) {
          bySlug.set(slug, product.categoryLabels[index] ?? slug);
        }
      });
    }
    return Array.from(bySlug, ([slug, label]) => ({ slug, label }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesFilter = filter === "all" || product.categorySlugs.includes(filter);
      const matchesQuery =
        !normalizedQuery ||
        [
          product.title,
          product.shortCopy,
          product.sku,
          product.variantTitle,
          ...product.categoryLabels,
          ...product.concernLabels,
          ...product.productTypeLabels,
          ...product.routineLabels,
          ...product.tags
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [filter, products, query]);

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

  // Same "shares a category" logic as the full product page's related-
  // products section, just scoped to the quick-view sheet.
  const relatedProducts = useMemo(() => {
    if (!selectedProduct) {
      return [];
    }
    const seenProductIds = new Set<string>();
    return products.filter((product) => {
      if (
        product.id === selectedProduct.id ||
        seenProductIds.has(product.id) ||
        !product.categorySlugs.some((slug) => selectedProduct.categorySlugs.includes(slug))
      ) {
        return false;
      }
      seenProductIds.add(product.id);
      return true;
    }).slice(0, 4);
  }, [products, selectedProduct]);

  const variantCountByProductId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.id, (counts.get(product.id) ?? 0) + 1);
    }
    return counts;
  }, [products]);

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
          <h1>Shop our products.</h1>
          {sourceMessage ? <p>{sourceMessage}</p> : null}
        </div>
      </section>

      {products.length > 0 ? (
        <section className="shop-filter-bar" aria-label="Shop filters">
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

          <FilterChips filter={filter} onSelect={setFilter} options={categoryOptions} />
        </section>
      ) : null}

      {products.length === 0 ? (
        <section className="shop-empty">
          <h2>We&apos;re restocking.</h2>
          <p>New products are on their way — check back soon.</p>
        </section>
      ) : filteredProducts.length > 0 ? (
        <section className="depth-shop-grid" aria-label="Products">
          {filteredProducts.map((product) => {
            const hasMultipleVariants = (variantCountByProductId.get(product.id) ?? 1) > 1;

            return (
              <ProductTile
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
          <h2>Nothing matched that yet.</h2>
          <p>Try clearing your filters, or search for something else.</p>
          <button
            className="portal-cta"
            onClick={() => {
              setFilter("all");
              setQuery("");
            }}
            type="button"
          >
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
            <div className={`sheet-stage podium-surface ${selectedProduct.tone}`} aria-hidden="true">
              <ProductPackshot product={selectedProduct} />
            </div>
            <div className="sheet-copy">
              <span>
                {selectedProduct.primaryCategory} / {selectedProduct.variantTitle}
              </span>
              <h2 id="product-sheet-title">{selectedProduct.title}</h2>
              <p>{selectedProduct.shortCopy}</p>
              <div className="sheet-meta">
                <div className="price-with-compare">
                  <strong>{selectedProduct.formattedPrice}</strong>
                  {selectedProduct.formattedCompareAtPrice ? (
                    <s>{selectedProduct.formattedCompareAtPrice}</s>
                  ) : null}
                </div>
                <small>{selectedProduct.stockAvailable} available</small>
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
                label="Add to cart"
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
                      <button
                        className="sheet-related-card"
                        key={related.variantId}
                        onClick={() => setSelectedId(related.variantId)}
                        type="button"
                      >
                        <div className="sheet-related-figure" aria-hidden="true">
                          {related.imageUrl ? (
                            <Image alt="" fill sizes="120px" src={related.imageUrl} />
                          ) : null}
                        </div>
                        <span>{related.title}</span>
                        <strong>{related.formattedPrice}</strong>
                      </button>
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

function FilterChips({
  filter,
  onSelect,
  options
}: {
  filter: string;
  onSelect: (value: string) => void;
  options: DiscoveryOption[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [glide, setGlide] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const active = container.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) {
      setGlide(null);
      return;
    }

    setGlide({ left: active.offsetLeft, width: active.offsetWidth });
  }, [filter, options]);

  return (
    <div className="filter-chip-row" ref={containerRef}>
      {glide ? (
        <span
          aria-hidden="true"
          className="filter-chip-glide"
          style={{ transform: `translateX(${glide.left}px)`, width: glide.width }}
        />
      ) : null}
      <button
        className="filter-chip"
        data-active={filter === "all"}
        onClick={() => onSelect("all")}
        type="button"
      >
        All
      </button>
      {options.map((option) => (
        <button
          className="filter-chip"
          data-active={filter === option.slug}
          key={option.slug}
          onClick={() => onSelect(option.slug)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ProductTile({
  hasMultipleVariants,
  onQuickAdd,
  onSelect,
  product
}: {
  hasMultipleVariants: boolean;
  onQuickAdd: () => void;
  onSelect: () => void;
  product: StorefrontProductView;
}) {
  const [added, setAdded] = useState(false);

  return (
    <article className="depth-product-card">
      <button className="depth-product-card-hit" onClick={onSelect} type="button">
        <div className="depth-product-stage" aria-hidden="true">
          <ProductPackshot product={product} />
        </div>
        <span>{product.primaryCategory}</span>
        <h2>{product.title}</h2>
        <div className="price-with-compare">
          <strong>{product.formattedPrice}</strong>
          {product.formattedCompareAtPrice ? <s>{product.formattedCompareAtPrice}</s> : null}
        </div>
      </button>
      <button
        aria-label={
          hasMultipleVariants
            ? `Choose a size for ${product.title}`
            : `Quick add ${product.title} to cart`
        }
        className={`quick-add-button ${added ? "added" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          onQuickAdd();
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

function ProductPackshot({ product }: { product: StorefrontProductView }) {
  if (product.imageUrl) {
    return (
      <div className="product-packshot photo-packshot">
        <Image
          src={product.imageUrl}
          alt=""
          fill
          sizes="(max-width: 820px) calc(100vw - 80px), 430px"
          aria-hidden="true"
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
