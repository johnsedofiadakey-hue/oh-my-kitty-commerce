"use client";

import { useState, type ReactNode } from "react";

export type CartLine = {
  productId: string;
  variantId: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
};

const cartStorageKey = "oh-my-kitty-cart-v1";
const cartChangedEvent = "oh-my-kitty-cart-changed";
const emptyCartLines: CartLine[] = [];
let cachedCartRaw: string | null = null;
let cachedCartLines: CartLine[] = emptyCartLines;

type AddToBagButtonProps = {
  className?: string;
  label?: ReactNode;
  line: CartLine;
};

export function AddToBagButton({
  className = "product-add-button",
  label = "Add to bag",
  line
}: AddToBagButtonProps) {
  const [added, setAdded] = useState(false);

  function handleClick() {
    addLineToCart(line);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  }

  return (
    <button className={className} onClick={handleClick} type="button">
      {added ? "Added" : label}
    </button>
  );
}

export function readCartLines(): CartLine[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(cartStorageKey);
    if (raw === cachedCartRaw) {
      return cachedCartLines;
    }

    const parsed = raw ? JSON.parse(raw) : [];
    cachedCartRaw = raw;
    cachedCartLines = Array.isArray(parsed) ? parsed.filter(isCartLine) : emptyCartLines;
    return cachedCartLines;
  } catch {
    return emptyCartLines;
  }
}

export function writeCartLines(lines: CartLine[]) {
  const raw = JSON.stringify(lines);
  cachedCartRaw = raw;
  cachedCartLines = lines;
  window.localStorage.setItem(cartStorageKey, raw);
  window.dispatchEvent(new Event(cartChangedEvent));
}

export function clearCartLines() {
  writeCartLines([]);
}

export function onCartChanged(listener: () => void) {
  window.addEventListener(cartChangedEvent, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(cartChangedEvent, listener);
    window.removeEventListener("storage", listener);
  };
}

export function addLineToCart(nextLine: CartLine) {
  const lines = readCartLines();
  const existing = lines.find((line) => line.variantId === nextLine.variantId);

  const nextLines = existing
    ? lines.map((line) =>
        line.variantId === nextLine.variantId
          ? { ...line, quantity: line.quantity + nextLine.quantity }
          : line
      )
    : [...lines, nextLine];

  writeCartLines(nextLines);
}

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") {
    return false;
  }

  const line = value as Partial<CartLine>;
  return (
    typeof line.productId === "string" &&
    typeof line.variantId === "string" &&
    typeof line.productTitle === "string" &&
    typeof line.variantTitle === "string" &&
    typeof line.sku === "string" &&
    typeof line.unitPrice === "number" &&
    typeof line.quantity === "number"
  );
}
