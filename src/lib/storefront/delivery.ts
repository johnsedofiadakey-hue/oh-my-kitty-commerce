import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { sampleDeliveryRules } from "@/lib/commerce/sample-data";
import type { DeliveryRule } from "@/lib/commerce/types";
import { formatMoney } from "@/lib/commerce/format";

export type StorefrontDeliveryOption = {
  id: string;
  name: string;
  type: DeliveryRule["type"];
  fee: number;
  formattedFee: string;
  freeAbove?: number | null;
  estimate?: string;
};

/**
 * A rule that requires a free-delivery-tagged item is only selectable once
 * at least one such item is in the cart — mixing in untagged items doesn't
 * block it, but a cart with none at all doesn't get the option. Shared by
 * the two other spots that need this exact same check: the delivery-options
 * API route (UX — hides the option) and the checkout route's server-side
 * resolveDeliveryRule (the check that actually matters, since a client can
 * submit any rule id it likes).
 */
export function isDeliveryRuleEligible(rule: DeliveryRule, cartHasFreeDeliveryItem: boolean): boolean {
  return !rule.requiresFreeDeliveryItem || cartHasFreeDeliveryItem;
}

export async function getStorefrontDeliveryOptions(productIds?: string[]): Promise<StorefrontDeliveryOption[]> {
  const context = getCommerceServerContext();
  if (!context) {
    return toOptions(sampleDeliveryRules, false);
  }

  try {
    const [rules, cartHasFreeDeliveryItem] = await Promise.all([
      context.repo.listDeliveryRules(),
      hasFreeDeliveryItem(context, productIds)
    ]);
    const active = rules.filter((rule) => rule.active);
    return active.length > 0
      ? toOptions(active, cartHasFreeDeliveryItem)
      : toOptions(sampleDeliveryRules, cartHasFreeDeliveryItem);
  } catch {
    return toOptions(sampleDeliveryRules, false);
  }
}

/**
 * Whether any of the given cart product ids is tagged `freeDelivery`.
 * `productIds` is omitted by callers (like the cart drawer) that only need
 * the raw fee/freeAbove data, not eligibility filtering — those get `false`
 * here, which only affects rules that opt into `requiresFreeDeliveryItem`.
 */
async function hasFreeDeliveryItem(
  context: NonNullable<ReturnType<typeof getCommerceServerContext>>,
  productIds: string[] | undefined
): Promise<boolean> {
  if (!productIds || productIds.length === 0) {
    return false;
  }

  const ids = new Set(productIds);
  const products = await context.repo.listProducts();
  return products.some((product) => ids.has(product.id) && product.freeDelivery);
}

function toOptions(rules: DeliveryRule[], cartHasFreeDeliveryItem: boolean): StorefrontDeliveryOption[] {
  return rules
    .filter((rule) => rule.active && isDeliveryRuleEligible(rule, cartHasFreeDeliveryItem))
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((rule) => ({
      id: rule.id,
      name: rule.name,
      type: rule.type,
      fee: rule.fee,
      formattedFee: formatMoney(rule.fee),
      freeAbove: rule.freeAbove,
      estimate: rule.estimate
    }));
}
