import Link from "next/link";
import { CartClient } from "@/components/storefront/cart-client";

export default function CartPage() {
  return (
    <main className="cart-page">
      <header className="shop-header">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <Link className="portal-link" href="/shop">
          Continue shopping
        </Link>
      </header>
      <CartClient />
    </main>
  );
}
