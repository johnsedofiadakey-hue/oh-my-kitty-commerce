import type { Metadata } from "next";
import { DepthShop } from "@/components/storefront/depth-shop";
import {
  getStorefrontCatalogue,
  toStorefrontProductViews
} from "@/lib/storefront/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop Feminine Wellness Products",
  description:
    "Browse the full Oh My Kitty catalogue in Ghana — infection care sets, boric acid, feminine wash, period care, libido support, and razor-bump treatments. By need, product, or routine.",
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
