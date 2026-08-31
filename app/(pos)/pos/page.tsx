import { PosSaleClient } from "@/components/pos/pos-sale-client";
import {
  getStorefrontCatalogue,
  toStorefrontProductViews
} from "@/lib/storefront/catalogue";
import { getRequiredPosActor } from "@/lib/auth/pos-server";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const [catalogue, actor] = await Promise.all([getStorefrontCatalogue(), getRequiredPosActor()]);
  const products = toStorefrontProductViews(catalogue);

  return (
    <PosSaleClient
      products={products}
      source={catalogue.source}
      sourceMessage={catalogue.sourceMessage}
      staffName={actor.displayName ?? actor.email ?? "Staff"}
    />
  );
}
