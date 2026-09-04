import Image from "next/image";
import type { Metadata } from "next";
import { TransactionalHeader } from "@/components/storefront/transactional-header";
import { OrderHistoryClient } from "@/components/storefront/order-history-client";

export const metadata: Metadata = {
  title: "Your Orders",
  description: "Orders you've placed on this device.",
  alternates: { canonical: "/orders" },
  robots: { index: false, follow: true }
};

export default function OrderHistoryPage() {
  return (
    <main className="cart-page">
      <div className="cart-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/petals.svg" />
      </div>
      <TransactionalHeader actionHref="/shop" actionLabel="Continue shopping" />
      <OrderHistoryClient />
    </main>
  );
}
