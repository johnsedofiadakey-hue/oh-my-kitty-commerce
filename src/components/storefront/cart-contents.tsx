"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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

type DeliveryOption = {
  id: string;
  name: string;
  type: "PICKUP" | "LOCAL_DELIVERY" | "NATIONWIDE_DELIVERY";
  fee: number;
  formattedFee: string;
  freeAbove?: number | null;
  estimate?: string;
};

export function CartContents({ onNavigate }: CartContentsProps) {
  const lines = useSyncExternalStore(subscribeToCart, readCartLines, getServerCartSnapshot);
  const subtotal = useMemo(
    () => lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0),
    [lines]
  );
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/storefront/delivery-options")
      .then((response) => response.json())
      .then((payload: { options?: DeliveryOption[] }) => {
        if (!cancelled) {
          setDeliveryOptions(payload.options ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDeliveryOptions([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The lowest free-delivery threshold across active delivery options — the
  // one worth showing progress toward, since it's the easiest to unlock.
  const freeDeliveryThreshold = useMemo(() => {
    const thresholds = deliveryOptions
      .map((option) => option.freeAbove)
      .filter((value): value is number => typeof value === "number" && value > 0);
    return thresholds.length > 0 ? Math.min(...thresholds) : null;
  }, [deliveryOptions]);

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
        <Image
          alt=""
          aria-hidden="true"
          className="cart-empty-mascot"
          height={72}
          src="/brand/oh-my-kitty-logo.jpeg"
          width={72}
        />
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
              {displayVariant(line) ? <span>{displayVariant(line)}</span> : null}
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

      {freeDeliveryThreshold ? (
        <FreeDeliveryProgress subtotal={subtotal} threshold={freeDeliveryThreshold} />
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

function displayVariant(line: CartLine) {
  return line.variantTitle.toLowerCase() === "default" ? "" : line.variantTitle;
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

function FreeDeliveryProgress({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  const unlocked = subtotal >= threshold;
  const progress = Math.min(1, subtotal / threshold);
  const wasUnlocked = useRef(unlocked);
  const [justUnlocked, setJustUnlocked] = useState(false);

  useEffect(() => {
    if (unlocked && !wasUnlocked.current) {
      setJustUnlocked(true);
      window.setTimeout(() => setJustUnlocked(false), 900);
    }
    wasUnlocked.current = unlocked;
  }, [unlocked]);

  return (
    <div className={`free-delivery-progress ${justUnlocked ? "pop" : ""}`}>
      <p>
        {unlocked
          ? "You've unlocked free delivery! 🎉"
          : `Add ${formatMoney(threshold - subtotal)} more for free delivery.`}
      </p>
      <div className="free-delivery-track">
        <div className="free-delivery-fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
