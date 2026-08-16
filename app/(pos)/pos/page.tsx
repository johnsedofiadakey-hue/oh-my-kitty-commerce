import { PosSaleClient } from "@/components/pos/pos-sale-client";
import {
  getStorefrontCatalogue,
  toStorefrontProductViews
} from "@/lib/storefront/catalogue";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const catalogue = await getStorefrontCatalogue();
  const products = toStorefrontProductViews(catalogue);

  return (
    <PosSaleClient
      products={products}
      source={catalogue.source}
      sourceMessage={catalogue.sourceMessage}
    />
  );
}
