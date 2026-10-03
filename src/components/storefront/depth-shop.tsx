"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import {
  AddToBagButton,
  addLineToCart,
  type CartLine
} from "@/components/storefront/add-to-bag-button";
import { CartTrigger } from "@/components/storefront/cart-trigger";
import { ShopFilters } from "@/components/storefront/shop-filters";
import { StorefrontNav } from "@/components/storefront/storefront-nav";
import type { ShopFilterOptions, StorefrontProductView } from "@/lib/storefront/catalogue";
import { celebrateBurst } from "@/lib/storefront/celebrate";
import { openCart } from "@/lib/storefront/cart-store";
import { usePhotoBackdrop } from "@/lib/storefront/use-photo-backdrop";

type DepthShopProps = {
  filterOptions: ShopFilterOptions;
  initialCategory?: string;
  initialNeed?: string;
  products: StorefrontProductView[];
  sourceMessage?: string;
};

export function DepthShop({
  filterOptions,
  initialCategory = "",
  initialNeed = "",
  products,
  sourceMessage
}: DepthShopProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // A shared link can carry a stale or mistyped filter — only honour ones
  // that are real choices, so the page never opens on an empty grid.
  const [need, setNeed] = useState(() =>
    filterOptions.needs.some((option) => option.slug === initialNeed) ? initialNeed : ""
  );
  const [category, setCategory] = useState(() =>
    filterOptions.categories.some((option) => option.slug === initialCategory) ? initialCategory : ""
  );
  const { backgroundColor: sheetBackdrop, handleLoad: handleSheetLoad } = usePhotoBackdrop();

  // Keep the address in step with the filters so a filtered view can be
  // shared or bookmarked. replaceState (not router.replace) because the page
  // is server-rendered and a navigation would refetch the whole catalogue.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (need) {
      url.searchParams.set("need", need);
    } else {
      url.searchParams.delete("need");
    }
    if (category) {
      url.searchParams.set("category", category);
    } else {
      url.searchParams.delete("category");
    }
    window.history.replaceState(window.history.state, "", url);
  }, [need, category]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      if (need && !product.concernSlugs.includes(need)) {
        return false;
      }
      if (category && !product.productTypeSlugs.includes(category)) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }

      return [
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
        .includes(normalizedQuery);
    });
  }, [products, query, need, category]);

  const isNarrowed = Boolean(need || category || query.trim());

  function clearAllFilters() {
    setQuery("");
    setNeed("");
    setCategory("");
  }

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
    <div className="shop-simple">
      <StorefrontNav />

      <main className="shop-simple-main">
        <div className="shop-simple-bar">
          <h1>Shop</h1>
          {products.length > 0 ? (
            <label className="shop-simple-search">
              <input
                aria-label="Search products"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products"
                type="search"
                value={query}
              />
            </label>
          ) : null}
        </div>
        {sourceMessage ? <p className="shop-simple-note">{sourceMessage}</p> : null}

        {products.length > 0 ? (
          <ShopFilters
            categories={filterOptions.categories}
            category={category}
            need={need}
            needs={filterOptions.needs}
            onCategoryChange={setCategory}
            onNeedChange={setNeed}
          />
        ) : null}
        {isNarrowed && filteredProducts.length > 0 ? (
          <p className="shop-filter-status" aria-live="polite">
            Showing {filteredProducts.length} of {products.length}
            <button onClick={clearAllFilters} type="button">
              Clear
            </button>
          </p>
        ) : null}

        {products.length === 0 ? (
          <section className="shop-simple-empty">
            <h2>We&apos;re restocking.</h2>
            <p>New products are on their way — check back soon.</p>
          </section>
        ) : filteredProducts.length > 0 ? (
          <section className="shop-simple-grid" aria-label="Products">
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
          <section className="shop-simple-empty">
            <h2>Nothing matched that.</h2>
            <p>Try a different word, or clear your filters.</p>
            <button className="shop-simple-clear" onClick={clearAllFilters} type="button">
              Show everything
            </button>
          </section>
        )}
      </main>

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
              style={sheetBackdrop ? { background: sheetBackdrop } : undefined}
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
  const { backgroundColor: photoBackdrop, handleLoad } = usePhotoBackdrop();

  return (
    <article className="shop-card">
      <button className="shop-card-open" onClick={onSelect} type="button">
        <span
          className="shop-card-photo"
          aria-hidden="true"
          style={photoBackdrop ? { backgroundColor: photoBackdrop } : undefined}
        >
          <ProductPackshot product={product} onImageLoad={handleLoad} />
        </span>
        <span className="shop-card-body">
          <span className="shop-card-title">{product.title}</span>
          <span className="shop-card-price">
            <strong>{product.formattedPrice}</strong>
            {product.formattedCompareAtPrice ? <s>{product.formattedCompareAtPrice}</s> : null}
          </span>
          {product.bestSeller || product.freeDelivery ? (
            <span className="shop-card-tags">
              {product.bestSeller ? <span className="tag-best">Best seller</span> : null}
              {product.freeDelivery ? <span className="tag-free">Free delivery</span> : null}
            </span>
          ) : null}
        </span>
      </button>
      <button
        aria-label={
          hasMultipleVariants
            ? `Choose a size for ${product.title}`
            : `Quick add ${product.title} to cart`
        }
        className={`shop-card-add ${added ? "added" : ""}`}
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
