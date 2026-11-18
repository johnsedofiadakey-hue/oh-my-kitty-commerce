import { PosSaleClient } from "@/components/pos/pos-sale-client";
import {
  getStorefrontCatalogue,
  toStorefrontProductViews
} from "@/lib/storefront/catalogue";
import { getRequiredPosActor } from "@/lib/auth/pos-server";
import { getMomoAccounts } from "@/lib/storefront/content";
import { getEffectiveRoles } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { hasPermission } from "@/lib/permissions/permissions";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const [catalogue, actor, momoAccounts] = await Promise.all([
    getStorefrontCatalogue(),
    getRequiredPosActor(),
    getMomoAccounts()
  ]);
  const products = toStorefrontProductViews(catalogue);

  const context = getCommerceServerContext();
  const roles = context ? await getEffectiveRoles(context, actor.roleIds) : [];
  const canViewOrders = hasPermission(roles, actor, "orders.view");

  return (
    <PosSaleClient
      canViewOrders={canViewOrders}
      momoAccounts={momoAccounts}
      products={products}
      source={catalogue.source}
      sourceMessage={catalogue.sourceMessage}
      staffName={actor.displayName ?? actor.email ?? "Staff"}
    />
  );
}
