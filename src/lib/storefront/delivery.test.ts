import { describe, expect, it } from "vitest";
import { isDeliveryRuleEligible } from "@/lib/storefront/delivery";
import type { DeliveryRule } from "@/lib/commerce/types";

function buildRule(overrides: Partial<DeliveryRule> = {}): DeliveryRule {
  return {
    id: "delivery-free",
    name: "Free Delivery",
    type: "NATIONWIDE_DELIVERY",
    active: true,
    regions: [],
    fee: 0,
    freeAbove: null,
    sortOrder: 1,
    ...overrides
  };
}

describe("isDeliveryRuleEligible", () => {
  it("is always eligible when the rule doesn't require a free-delivery item", () => {
    const rule = buildRule({ requiresFreeDeliveryItem: false });
    expect(isDeliveryRuleEligible(rule, false)).toBe(true);
    expect(isDeliveryRuleEligible(rule, true)).toBe(true);
  });

  it("is eligible when gated and the cart has at least one tagged item (mixed cart)", () => {
    const rule = buildRule({ requiresFreeDeliveryItem: true });
    expect(isDeliveryRuleEligible(rule, true)).toBe(true);
  });

  it("is ineligible when gated and the cart has zero tagged items", () => {
    const rule = buildRule({ requiresFreeDeliveryItem: true });
    expect(isDeliveryRuleEligible(rule, false)).toBe(false);
  });

  it("treats an unset requiresFreeDeliveryItem the same as false", () => {
    const rule = buildRule();
    expect(isDeliveryRuleEligible(rule, false)).toBe(true);
  });
});
