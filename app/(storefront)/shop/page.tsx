import { DepthShop } from "@/components/storefront/depth-shop";
import {
  getStorefrontCatalogue,
  toStorefrontProductViews
} from "@/lib/storefront/catalogue";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const catalogue = await getStorefrontCatalogue();

  return (
    <DepthShop
      products={toStorefrontProductViews(catalogue)}
      sourceMessage={catalogue.sourceMessage}
    />
  );
}
