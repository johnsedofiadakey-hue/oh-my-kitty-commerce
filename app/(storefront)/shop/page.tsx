import type { Metadata } from "next";
import { DepthShop } from "@/components/storefront/depth-shop";
import {
  getStorefrontCatalogue,
  toStorefrontProductViews
} from "@/lib/storefront/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse the full Oh My Kitty intimate care catalogue — by need, product, or routine.",
  alternates: { canonical: "/shop" }
};

export default async function ShopPage() {
  const catalogue = await getStorefrontCatalogue();

  return (
    <DepthShop
      products={toStorefrontProductViews(catalogue)}
      sourceMessage={catalogue.sourceMessage}
    />
  );
}
