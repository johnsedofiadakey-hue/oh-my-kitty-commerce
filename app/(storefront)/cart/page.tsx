import Image from "next/image";
import { CartClient } from "@/components/storefront/cart-client";
import { TransactionalHeader } from "@/components/storefront/transactional-header";
import { getStorefrontDeliveryOptions } from "@/lib/storefront/delivery";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const deliveryOptions = await getStorefrontDeliveryOptions();
  const cheapestDeliveryFee =
    deliveryOptions.length > 0 ? Math.min(...deliveryOptions.map((option) => option.fee)) : 0;

  return (
    <main className="cart-page">
      <div className="cart-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/leaf-midground-01.svg" />
      </div>
      <TransactionalHeader actionHref="/shop" actionLabel="Continue shopping" />
      <CartClient estimatedDeliveryFee={cheapestDeliveryFee} />
    </main>
  );
}
