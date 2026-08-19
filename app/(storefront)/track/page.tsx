import Image from "next/image";
import type { Metadata } from "next";
import { Suspense } from "react";
import { TransactionalHeader } from "@/components/storefront/transactional-header";
import { TrackOrderClient } from "@/components/storefront/track-order-client";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Check your Oh My Kitty order status with your order number.",
  alternates: { canonical: "/track" },
  robots: { index: false, follow: true }
};

export default function TrackOrderPage() {
  return (
    <main className="cart-page">
      <div className="cart-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/petals.svg" />
      </div>
      <TransactionalHeader actionHref="/shop" actionLabel="Continue shopping" />
      <Suspense>
        <TrackOrderClient />
      </Suspense>
    </main>
  );
}
