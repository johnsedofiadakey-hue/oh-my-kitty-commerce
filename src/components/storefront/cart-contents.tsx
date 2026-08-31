"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  clearCartLines,
  onCartChanged,
  readCartLines,
  writeCartLines,
  type CartLine
} from "@/components/storefront/add-to-bag-button";
import { BagIcon } from "@/components/storefront/icons";
import { formatMoney } from "@/lib/commerce/format";

const serverCartSnapshot: CartLine[] = [];

type CartContentsProps = {
  /** Called right before navigating to checkout — lets the drawer close itself. */
  onNavigate?: () => void;
};

type Recommendation = {
  productId: string;
  variantId: string;
  title: string;
  variantTitle: string;
  sku: string;
  unitPrice: number;
  formattedPrice: string;
  imageUrl?: string;
};

export function CartContents({ onNavigate }: CartContentsProps) {
  const lines = useSyncExternalStore(subscribeToCart, readCartLines, getServerCartSnapshot);
  const subtotal = useMemo(
    () => lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0),
    [lines]
  );
  const cartProductIds = useMemo(
    () => Array.from(new Set(lines.map((line) => line.productId))).sort(),
    [lines]
  );
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    // No early setRecommendations([]) here on purpose — when the cart is
    // genuinely empty the component returns its own "empty cart" view below
    // before this section would ever render, so there's nothing stale to
    // clear, and synchronously setting state inside an effect body is
    // exactly what react-hooks/set-state-in-effect flags.
    if (cartProductIds.length === 0) {
      return;
    }

    let cancelled = false;
    fetch(`/api/storefront/recommendations?productIds=${cartProductIds.join(",")}`)
      .then((response) => response.json())
      .then((payload: { products?: Recommendation[] }) => {
        if (!cancelled) {
          setRecommendations(payload.products ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecommendations([]);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cartProductIds is a derived, sorted, deduped array; comparing its join() avoids refetching on quantity-only changes.
  }, [cartProductIds.join(",")]);

  function addRecommendation(item: Recommendation) {
    const existing = lines.find((line) => line.variantId === item.variantId);
    const nextLines = existing
      ? lines.map((line) =>
          line.variantId === item.variantId ? { ...line, quantity: line.quantity + 1 } : line
        )
      : [
          ...lines,
          {
            productId: item.productId,
            variantId: item.variantId,
            productTitle: item.title,
            variantTitle: item.variantTitle,
            sku: item.sku,
            unitPrice: item.unitPrice,
            quantity: 1,
            imageUrl: item.imageUrl
          }
        ];

    writeCartLines(nextLines);
  }

  function updateQuantity(variantId: string, quantity: number) {
    const nextLines = lines
      .map((line) => (line.variantId === variantId ? { ...line, quantity } : line))
      .filter((line) => line.quantity > 0);

    writeCartLines(nextLines);
  }

  function removeLine(variantId: string) {
    writeCartLines(lines.filter((line) => line.variantId !== variantId));
  }

  if (lines.length === 0) {
    return (
      <div className="cart-surface cart-empty">
        <span className="scene-kicker">Cart</span>
        <h1>Your cart is empty.</h1>
        <p>Products added from the shop will appear here.</p>
        <Link className="portal-cta" href="/shop">
          <span>Start shopping</span>
          <i aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-surface">
      <div className="cart-heading">
        <div>
          <span className="scene-kicker">Cart</span>
          <h1>Your cart</h1>
        </div>
        <button className="text-button" onClick={clearCartLines} type="button">
          Clear
        </button>
      </div>
      <div className="cart-lines">
        {lines.map((line) => (
          <article className="cart-item" key={line.variantId}>
            <div className="cart-item-figure" aria-hidden="true">
              {line.imageUrl ? (
                <Image alt="" fill sizes="88px" src={line.imageUrl} />
              ) : (
                <Image alt="" height={40} src="/brand/oh-my-kitty-logo.jpeg" width={40} />
              )}
            </div>
            <div className="cart-item-copy">
              <strong>{line.productTitle}</strong>
              <span>{line.variantTitle}</span>
              <small>{formatMoney(line.unitPrice)} each</small>
            </div>
            <div className="qty-stepper">
              <button
                aria-label={`Decrease ${line.productTitle}`}
                onClick={() => updateQuantity(line.variantId, line.quantity - 1)}
                type="button"
              >
                −
              </button>
              <span>{line.quantity}</span>
              <button
                aria-label={`Increase ${line.productTitle}`}
                onClick={() => updateQuantity(line.variantId, line.quantity + 1)}
                type="button"
              >
                +
              </button>
            </div>
            <div className="cart-item-total">
              <strong>{formatMoney(line.unitPrice * line.quantity)}</strong>
              <button
                aria-label={`Remove ${line.productTitle}`}
                className="cart-item-remove"
                onClick={() => removeLine(line.variantId)}
                type="button"
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>

      {recommendations.length > 0 ? (
        <div className="cart-recommendations">
          <span className="cart-recommendations-label">Goes well with your cart</span>
          <div className="cart-recommendations-row">
            {recommendations.map((item) => (
              <div className="cart-recommendation-card" key={item.variantId}>
                <div className="cart-recommendation-figure" aria-hidden="true">
                  {item.imageUrl ? <Image alt="" fill sizes="80px" src={item.imageUrl} /> : null}
                </div>
                <span>{item.title}</span>
                <strong>{item.formattedPrice}</strong>
                <button
                  aria-label={`Add ${item.title} to cart`}
                  onClick={() => addRecommendation(item)}
                  type="button"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="checkout-summary">
        <div>
          <span>Subtotal</span>
          <strong>{formatMoney(subtotal)}</strong>
        </div>
        <p className="cart-delivery-note">Delivery fee confirmed at checkout — free option available.</p>
        <Link className="checkout-cta" href={"/checkout" as Route} onClick={onNavigate}>
          <span>Proceed to checkout</span>
          <BagIcon className="cta-icon" />
        </Link>
      </div>
    </div>
  );
}

function subscribeToCart(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  return onCartChanged(listener);
}

function getServerCartSnapshot(): CartLine[] {
  return serverCartSnapshot;
}
