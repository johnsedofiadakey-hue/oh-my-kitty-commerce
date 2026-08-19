"use client";

import type { Route } from "next";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { openCart } from "@/lib/storefront/cart-store";

type CartTriggerProps = {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  /** Lets a caller close its own overlay (e.g. the product sheet) before the cart opens on top of it. */
  onBeforeOpen?: () => void;
};

export function CartTrigger({ children, className, ariaLabel, onBeforeOpen }: CartTriggerProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }

    event.preventDefault();
    onBeforeOpen?.();
    openCart();
  }

  return (
    <Link aria-label={ariaLabel} className={className} href={"/cart" as Route} onClick={handleClick}>
      {children}
    </Link>
  );
}
