import Image from "next/image";
import { CartContents } from "@/components/storefront/cart-contents";
import { TransactionalHeader } from "@/components/storefront/transactional-header";

/**
 * Direct-navigation fallback (bookmarks, no-JS, "open in new tab" from the
 * bag icon) — day to day, CartTrigger opens the same content in the global
 * CartDrawer instead of routing here.
 */
export default function CartPage() {
  return (
    <main className="cart-page">
      <div className="cart-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/leaf-midground-01.svg" />
      </div>
      <TransactionalHeader actionHref="/shop" actionLabel="Continue shopping" />
      <CartContents />
    </main>
  );
}
