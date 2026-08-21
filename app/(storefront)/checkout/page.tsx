import Image from "next/image";
import type { Metadata } from "next";
import { CheckoutClient } from "@/components/storefront/checkout-client";
import { TransactionalHeader } from "@/components/storefront/transactional-header";
import { getStorefrontDeliveryOptions } from "@/lib/storefront/delivery";
import { isPaystackConfigured } from "@/lib/payments/paystack";
import { getContentValue } from "@/lib/storefront/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false }
};

export default async function CheckoutPage() {
  const [deliveryOptions, pickupLocation, pickupMapLink] = await Promise.all([
    getStorefrontDeliveryOptions(),
    getContentValue("pickup-location"),
    getContentValue("pickup-map-link")
  ]);

  return (
    <main className="cart-page">
      <div className="cart-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/leaf-foreground-01.svg" />
      </div>
      <TransactionalHeader actionHref="/cart" actionLabel="Back to cart" />
      <CheckoutClient
        deliveryOptions={deliveryOptions}
        paystackEnabled={isPaystackConfigured()}
        pickupLocation={pickupLocation}
        pickupMapLink={pickupMapLink}
      />
    </main>
  );
}
