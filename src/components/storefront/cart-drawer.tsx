"use client";

import { useEffect, useSyncExternalStore } from "react";
import { closeCart, isCartOpen, onCartOpenChanged } from "@/lib/storefront/cart-store";
import { CartContents } from "@/components/storefront/cart-contents";

export function CartDrawer() {
  const open = useSyncExternalStore(onCartOpenChanged, isCartOpen, () => false);

  useEffect(() => {
    if (!open) {
      return;
    }

    document.body.style.overflow = "hidden";

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCart();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [open]);

  return (
    <>
      {open ? (
        <button aria-label="Close cart" className="cart-drawer-backdrop" onClick={closeCart} type="button" />
      ) : null}
      <aside
        aria-hidden={!open}
        aria-label="Shopping cart"
        className={open ? "cart-drawer open" : "cart-drawer"}
      >
        <div className="cart-drawer-handle" aria-hidden="true" />
        <button aria-label="Close cart" className="sheet-close" onClick={closeCart} type="button">
          ×
        </button>
        <div className="cart-drawer-body">
          <CartContents onNavigate={closeCart} />
        </div>
      </aside>
    </>
  );
}
