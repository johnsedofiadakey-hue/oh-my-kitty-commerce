"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { AddToBagButton, type CartLine } from "@/components/storefront/add-to-bag-button";
import { CartTrigger } from "@/components/storefront/cart-trigger";
import { BagIcon } from "@/components/storefront/icons";
import { formatMoney } from "@/lib/commerce/format";
import type { StorefrontProductView } from "@/lib/storefront/catalogue";

type ProductDetailHeroProps = {
  variants: StorefrontProductView[];
};

export function ProductDetailHero({ variants }: ProductDetailHeroProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0].variantId);
  const [quantity, setQuantity] = useState(1);
  const selected = variants.find((entry) => entry.variantId === selectedVariantId) ?? variants[0];
  const hasMultipleSizes = variants.length > 1;
  const maxQuantity = Math.max(1, selected.stockAvailable);
  const linePrice = useMemo(() => formatMoney(selected.price * quantity), [selected.price, quantity]);

  function selectVariant(variantId: string) {
    setSelectedVariantId(variantId);
    setQuantity(1);
  }

  return (
    <section className={`product-detail-hero ${selected.tone}`}>
      <div className="product-detail-stage podium-surface" aria-hidden="true">
        {selected.imageUrl ? (
          <Image
            alt=""
            fill
            priority
            sizes="(max-width: 820px) 92vw, 520px"
            src={selected.imageUrl}
          />
        ) : (
          <Image alt="" height={160} priority src="/brand/oh-my-kitty-logo.jpeg" width={160} />
        )}
      </div>

      <div className="product-detail-copy">
        <Link className="scene-kicker" href={`/categories/${selected.primaryCategorySlug}` as Route}>
          {selected.primaryCategory}
        </Link>
        <h1>{selected.title}</h1>
        <p>{selected.description ?? selected.shortCopy}</p>

        <div className="product-detail-price">
          <div className="price-with-compare">
            <strong>{selected.formattedPrice}</strong>
            {selected.formattedCompareAtPrice ? <s>{selected.formattedCompareAtPrice}</s> : null}
          </div>
        </div>

        <div className="size-pill-row">
          <span className="size-pill-label">Size</span>
          {variants.map((variant) => (
            <button
              className={`size-pill ${variant.variantId === selectedVariantId ? "active" : ""}`}
              disabled={!hasMultipleSizes}
              key={variant.variantId}
              onClick={() => selectVariant(variant.variantId)}
              type="button"
            >
              {variant.variantTitle}
            </button>
          ))}

          <span className="qty-stepper" aria-label="Quantity">
            <button
              disabled={quantity <= 1}
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              type="button"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span>{quantity}</span>
            <button
              disabled={quantity >= maxQuantity}
              onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
              type="button"
              aria-label="Increase quantity"
            >
              +
            </button>
          </span>
        </div>

        <div className="product-detail-actions">
          <AddToBagButton
            className="pdp-add-button"
            label={
              <>
                <BagIcon className="cta-icon" />
                <span>Add to cart</span>
              </>
            }
            line={toCartLine(selected, quantity)}
          />
        </div>

        <div className="mini-cart-line">
          <div className="mini-cart-line-thumb">
            {selected.imageUrl ? <Image alt="" fill sizes="52px" src={selected.imageUrl} /> : null}
          </div>
          <div className="mini-cart-line-copy">
            <strong>{selected.title}</strong>
            <span>
              {selected.variantTitle} × {quantity}
            </span>
          </div>
          <strong className="mini-cart-line-price">{linePrice}</strong>
        </div>

        <CartTrigger className="checkout-cta">
          <span>View cart</span>
          <BagIcon className="cta-icon" />
        </CartTrigger>
      </div>
    </section>
  );
}

function toCartLine(product: StorefrontProductView, quantity: number): CartLine {
  return {
    productId: product.id,
    productTitle: product.title,
    quantity,
    sku: product.sku,
    unitPrice: product.price,
    imageUrl: product.imageUrl,
    variantId: product.variantId,
    variantTitle: product.variantTitle
  };
}
