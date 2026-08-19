"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AddToBagButton,
  addLineToCart,
  type CartLine
} from "@/components/storefront/add-to-bag-button";
import { CartTrigger } from "@/components/storefront/cart-trigger";
import { StorefrontNav } from "@/components/storefront/storefront-nav";
import type { StorefrontProductView } from "@/lib/storefront/catalogue";

type DepthShopProps = {
  products: StorefrontProductView[];
  sourceMessage?: string;
};

type DiscoveryMode = "need" | "product" | "routine";

type DiscoveryOption = {
  slug: string;
  label: string;
};

const DISCOVERY_MODES: { id: DiscoveryMode; label: string }[] = [
  { id: "need", label: "By need" },
  { id: "product", label: "By product" },
  { id: "routine", label: "By routine" }
];

const TILE_CYCLE_LENGTH = 7;

function tileTypeForIndex(index: number): "standard" | "featured" | "tall" | "feature" {
  const position = index % TILE_CYCLE_LENGTH;
  if (position === 2) return "featured";
  if (position === 5) return "tall";
  if (position === 6) return "feature";
  return "standard";
}

export function DepthShop({ products, sourceMessage }: DepthShopProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<DiscoveryMode>("need");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const optionsByMode = useMemo<Record<DiscoveryMode, DiscoveryOption[]>>(() => {
    const collect = (
      slugsKey: "concernSlugs" | "productTypeSlugs" | "routineSlugs",
      labelsKey: "concernLabels" | "productTypeLabels" | "routineLabels"
    ) => {
      const bySlug = new Map<string, string>();
      for (const product of products) {
        product[slugsKey].forEach((slug, index) => {
          if (!bySlug.has(slug)) {
            bySlug.set(slug, product[labelsKey][index] ?? slug);
          }
        });
      }
      return Array.from(bySlug, ([slug, label]) => ({ slug, label }));
    };

    return {
      need: collect("concernSlugs", "concernLabels"),
      product: collect("productTypeSlugs", "productTypeLabels"),
      routine: collect("routineSlugs", "routineLabels")
    };
  }, [products]);

  const options = optionsByMode[mode];

  function selectMode(nextMode: DiscoveryMode) {
    setMode(nextMode);
    setFilter("all");
  }

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const slugsKey =
      mode === "need" ? "concernSlugs" : mode === "product" ? "productTypeSlugs" : "routineSlugs";

    return products.filter((product) => {
      const matchesFilter = filter === "all" || product[slugsKey].includes(filter);
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
  }, [filter, mode, products, query]);

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

        gsap.to(".shop-hero-figure.center", {
          scale: 1.08,
          rotate: 2,
          ease: "none",
          scrollTrigger: {
            trigger: ".depth-shop-hero",
            start: "top top",
            end: "bottom top",
            scrub: 0.8
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
        <div className="shop-hero-stage" aria-hidden="true">
          <ShopHeroFigure position="left" product={products[2]} />
          <ShopHeroFigure position="center" product={products[0]} />
          <ShopHeroFigure position="right" product={products[1]} />
        </div>
        <div className="depth-shop-copy">
          <span className="scene-kicker">Shop</span>
          <h1>Shop your ritual.</h1>
          {sourceMessage ? <p>{sourceMessage}</p> : null}
        </div>
      </section>

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

        <div className="discovery-mode-switch" role="tablist" aria-label="Discovery mode">
          {DISCOVERY_MODES.map((entry) => (
            <button
              aria-selected={mode === entry.id}
              className={mode === entry.id ? "active" : ""}
              key={entry.id}
              onClick={() => selectMode(entry.id)}
              role="tab"
              type="button"
            >
              {entry.label}
            </button>
          ))}
        </div>

        <FilterChips filter={filter} onSelect={setFilter} options={options} />
      </section>

      {filteredProducts.length > 0 ? (
        <section className="depth-shop-grid" aria-label="Products">
          {filteredProducts.map((product, index) => {
            const hasMultipleVariants = (variantCountByProductId.get(product.id) ?? 1) > 1;

            return (
              <ProductTile
                hasMultipleVariants={hasMultipleVariants}
                key={product.variantId}
                onQuickAdd={() =>
                  hasMultipleVariants
                    ? setSelectedId(product.variantId)
                    : addLineToCart(toCartLine(product))
                }
                onSelect={() => setSelectedId(product.variantId)}
                product={product}
                tileType={tileTypeForIndex(index)}
                tone={product.tone}
              />
            );
          })}
        </section>
      ) : (
        <section className="shop-empty">
          <h2>Nothing matched that yet.</h2>
          <p>Try clearing filters, or explore by need instead.</p>
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
                <strong>{selectedProduct.formattedPrice}</strong>
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
                label="Add to bag"
                line={toCartLine(selectedProduct)}
              />
              <Link
                className="sheet-detail-link"
                href={`/products/${selectedProduct.slug}` as Route}
              >
                Explore product →
              </Link>
              <CartTrigger className="sheet-cart-link" onBeforeOpen={() => setSelectedId(null)}>
                View bag
              </CartTrigger>
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
  product,
  tileType,
  tone
}: {
  hasMultipleVariants: boolean;
  onQuickAdd: () => void;
  onSelect: () => void;
  product: StorefrontProductView;
  tileType: "standard" | "featured" | "tall" | "feature";
  tone: StorefrontProductView["tone"];
}) {
  const [added, setAdded] = useState(false);
  const isFeatureMoment = tileType === "feature";

  return (
    <article className={`depth-product-card tile-${tileType} ${isFeatureMoment ? tone : ""}`}>
      <button className="depth-product-card-hit" onClick={onSelect} type="button">
        <div className="depth-product-stage" aria-hidden="true">
          <ProductPackshot product={product} />
        </div>
        <span>{product.primaryCategory}</span>
        <h2>{product.title}</h2>
        <strong>{product.formattedPrice}</strong>
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

function ShopHeroFigure({
  position,
  product
}: {
  position: "left" | "center" | "right";
  product?: StorefrontProductView;
}) {
  if (!product?.imageUrl) {
    return null;
  }

  return (
    <div className={`shop-hero-figure ${position}`}>
      <Image
        alt=""
        aria-hidden="true"
        fill
        sizes="230px"
        src={product.imageUrl}
      />
    </div>
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
