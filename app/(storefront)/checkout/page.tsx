import Image from "next/image";
import { CheckoutClient } from "@/components/storefront/checkout-client";
import { TransactionalHeader } from "@/components/storefront/transactional-header";
import { getStorefrontDeliveryOptions } from "@/lib/storefront/delivery";
import { isPaystackConfigured } from "@/lib/payments/paystack";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const deliveryOptions = await getStorefrontDeliveryOptions();

  return (
    <main className="cart-page">
      <div className="cart-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/leaf-foreground-01.svg" />
      </div>
      <TransactionalHeader actionHref="/cart" actionLabel="Back to bag" />
      <CheckoutClient deliveryOptions={deliveryOptions} paystackEnabled={isPaystackConfigured()} />
    </main>
  );
}
