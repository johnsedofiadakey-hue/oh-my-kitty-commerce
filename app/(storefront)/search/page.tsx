import type { Metadata } from "next";
import { DepthShop } from "@/components/storefront/depth-shop";
import {
  getStorefrontCatalogue,
  toStorefrontProductViews
} from "@/lib/storefront/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true }
};

export default async function SearchPage() {
  const catalogue = await getStorefrontCatalogue();

  return (
    <DepthShop
      products={toStorefrontProductViews(catalogue)}
      sourceMessage="Search by product name, category, or size."
    />
  );
}
