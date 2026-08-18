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

export async function getStorefrontDeliveryOptions(): Promise<StorefrontDeliveryOption[]> {
  const context = getCommerceServerContext();
  if (!context) {
    return toOptions(sampleDeliveryRules);
  }

  try {
    const rules = await context.repo.listDeliveryRules();
    const active = rules.filter((rule) => rule.active);
    return active.length > 0 ? toOptions(active) : toOptions(sampleDeliveryRules);
  } catch {
    return toOptions(sampleDeliveryRules);
  }
}

function toOptions(rules: DeliveryRule[]): StorefrontDeliveryOption[] {
  return rules
    .filter((rule) => rule.active)
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
