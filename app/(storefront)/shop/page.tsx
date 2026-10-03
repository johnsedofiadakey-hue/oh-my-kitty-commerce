import type { Metadata } from "next";
import { DepthShop } from "@/components/storefront/depth-shop";
import {
  getShopFilterOptions,
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

type ShopPageProps = {
  searchParams: Promise<{ need?: string | string[]; category?: string | string[] }>;
};

function firstValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const [catalogue, params] = await Promise.all([getStorefrontCatalogue(), searchParams]);

  return (
    <DepthShop
      filterOptions={getShopFilterOptions(catalogue)}
      initialCategory={firstValue(params.category)}
      initialNeed={firstValue(params.need)}
      products={toStorefrontProductViews(catalogue)}
      sourceMessage={catalogue.sourceMessage}
    />
  );
}
