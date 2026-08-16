import { DepthShop } from "@/components/storefront/depth-shop";
import {
  getStorefrontCatalogue,
  toStorefrontProductViews
} from "@/lib/storefront/catalogue";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const catalogue = await getStorefrontCatalogue();

  return (
    <DepthShop
      products={toStorefrontProductViews(catalogue)}
      sourceMessage="Search by product name, category, variant, or SKU."
    />
  );
}
