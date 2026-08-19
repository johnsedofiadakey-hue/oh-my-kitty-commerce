"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useMemo, useSyncExternalStore } from "react";
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

export function CartContents({ onNavigate }: CartContentsProps) {
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

  function removeLine(variantId: string) {
    writeCartLines(lines.filter((line) => line.variantId !== variantId));
  }

  if (lines.length === 0) {
    return (
      <div className="cart-surface cart-empty">
        <span className="scene-kicker">Bag</span>
        <h1>Your ritual is waiting.</h1>
        <p>Products added from the shop will appear here.</p>
        <Link className="portal-cta" href="/shop">
          <span>Explore care</span>
          <i aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-surface">
      <div className="cart-heading">
        <div>
          <span className="scene-kicker">Bag</span>
          <h1>Your care edit</h1>
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
