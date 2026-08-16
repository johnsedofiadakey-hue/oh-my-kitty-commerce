"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AddToBagButton,
  type CartLine
} from "@/components/storefront/add-to-bag-button";
import { CartCount } from "@/components/storefront/cart-count";
import type { StorefrontProductView } from "@/lib/storefront/catalogue";

type DepthShopProps = {
  products: StorefrontProductView[];
  sourceMessage?: string;
};

export function DepthShop({ products, sourceMessage }: DepthShopProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const categories = useMemo(
    () =>
      Array.from(new Set(products.flatMap((product) => product.categoryLabels))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [products]
  );
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = category === "all" || product.categoryLabels.includes(category);
      const matchesQuery =
        !normalizedQuery ||
        [product.title, product.shortCopy, product.sku, product.variantTitle, ...product.categoryLabels]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);
  const selectedProduct = useMemo(
    () => products.find((product) => product.variantId === selectedId) ?? null,
    [products, selectedId]
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

        gsap.to(".shop-portal-mask", {
          scale: 1.16,
          rotate: 4,
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
      <header className="shop-header cinematic">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <Link className="bag-pill" href="/cart">
          <CartCount />
        </Link>
      </header>

      <section className="depth-shop-hero">
        <div className="shop-portal-mask" aria-hidden="true">
          <Image
            src="/brand/oh-my-kitty-logo.jpeg"
            alt=""
            width={190}
            height={190}
            priority
          />
        </div>
        <div className="depth-shop-copy">
          <span className="scene-kicker">Shop</span>
          <h1>Care, close up.</h1>
          {sourceMessage ? <p>{sourceMessage}</p> : null}
        </div>
      </section>

      <section className="shop-filter-bar" aria-label="Shop filters">
        <label className="shop-search">
          <span>Search</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search product or category"
            value={query}
          />
        </label>
        <div className="shop-category-tabs" aria-label="Categories">
          <button
            className={category === "all" ? "active" : ""}
            onClick={() => setCategory("all")}
            type="button"
          >
            All
          </button>
          {categories.map((entry) => (
            <button
              className={category === entry ? "active" : ""}
              key={entry}
              onClick={() => setCategory(entry)}
              type="button"
            >
              {entry}
            </button>
          ))}
        </div>
      </section>

      {filteredProducts.length > 0 ? (
        <section className="depth-shop-grid" aria-label="Products">
          {filteredProducts.map((product) => (
            <button
              className={`depth-product-card ${product.tone}`}
              key={product.variantId}
              onClick={() => setSelectedId(product.variantId)}
              type="button"
            >
              <div className="depth-product-stage" aria-hidden="true">
                <ProductPackshot product={product} />
              </div>
              <span>{product.primaryCategory}</span>
              <h2>{product.title}</h2>
              <p>{product.shortCopy}</p>
              <strong>{product.formattedPrice}</strong>
            </button>
          ))}
        </section>
      ) : (
        <section className="shop-empty">
          <h2>No products match this view.</h2>
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
            <div className={`sheet-stage ${selectedProduct.tone}`} aria-hidden="true">
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
              <AddToBagButton
                className="sheet-add-button"
                label="Add to bag"
                line={toCartLine(selectedProduct)}
              />
              <Link
                className="sheet-detail-link"
                href={`/products/${selectedProduct.slug}` as Route}
              >
                View full details
              </Link>
              <Link className="sheet-cart-link" href="/cart">
                View bag
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
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
    variantTitle: product.variantTitle
  };
}
