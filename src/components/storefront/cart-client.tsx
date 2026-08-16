"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  clearCartLines,
  onCartChanged,
  readCartLines,
  writeCartLines,
  type CartLine
} from "@/components/storefront/add-to-bag-button";
import { formatMoney } from "@/lib/commerce/format";

const serverCartSnapshot: CartLine[] = [];

export function CartClient() {
  const lines = useSyncExternalStore(subscribeToCart, readCartLines, getServerCartSnapshot);
  const subtotal = useMemo(
    () => lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0),
    [lines]
  );

  function updateQuantity(variantId: string, quantity: number) {
    const nextLines = lines
      .map((line) => (line.variantId === variantId ? { ...line, quantity } : line))
      .filter((line) => line.quantity > 0);

    writeCartLines(nextLines);
  }

  function clearCart() {
    clearCartLines();
  }

  if (lines.length === 0) {
    return (
      <section className="cart-surface">
        <h1>Your bag is empty.</h1>
        <p>Products added from the shop will appear here.</p>
      </section>
    );
  }

  return (
    <section className="cart-surface">
      <div className="cart-heading">
        <div>
          <span className="scene-kicker">Bag</span>
          <h1>Your care edit</h1>
        </div>
        <button className="text-button" onClick={clearCart} type="button">
          Clear
        </button>
      </div>
      <div className="cart-lines">
        {lines.map((line) => (
          <article className="cart-item" key={line.variantId}>
            <div>
              <strong>{line.productTitle}</strong>
              <span>{line.variantTitle}</span>
              <small>{line.sku}</small>
            </div>
            <div className="quantity-stepper">
              <button
                aria-label={`Decrease ${line.productTitle}`}
                onClick={() => updateQuantity(line.variantId, line.quantity - 1)}
                type="button"
              >
                -
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
            <strong>{formatMoney(line.unitPrice * line.quantity)}</strong>
          </article>
        ))}
      </div>
      <div className="checkout-summary">
        <div>
          <span>Subtotal</span>
          <strong>{formatMoney(subtotal)}</strong>
        </div>
        <button className="checkout-button" type="button">
          Continue to checkout
        </button>
        <p>Checkout payments and delivery capture are the next build step.</p>
      </div>
    </section>
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
