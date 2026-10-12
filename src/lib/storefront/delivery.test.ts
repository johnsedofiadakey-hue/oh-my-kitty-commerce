import { describe, expect, it } from "vitest";
import { deliveryUnavailableWithoutTaggedItem, isDeliveryRuleEligible } from "@/lib/storefront/delivery";
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

describe("deliveryUnavailableWithoutTaggedItem", () => {
  const rule = (over: Partial<DeliveryRule>): DeliveryRule => ({
    id: "r", name: "r", type: "NATIONWIDE_DELIVERY", active: true, regions: [],
    fee: 0, freeAbove: null, sortOrder: 0, ...over
  });

  it("flags the production fault: every shipping option gated behind the tag", () => {
    // Exactly what was live — the paid courier gated alongside the promo one,
    // leaving ordinary carts with collection only and no address field.
    expect(deliveryUnavailableWithoutTaggedItem([
      rule({ name: "Pickup", type: "PICKUP", requiresFreeDeliveryItem: undefined }),
      rule({ name: "Urgent Delivery", requiresFreeDeliveryItem: true }),
      rule({ name: "Free Delivery", requiresFreeDeliveryItem: true })
    ])).toBe(true);
  });

  it("stays quiet once one shipping option is open to everyone", () => {
    expect(deliveryUnavailableWithoutTaggedItem([
      rule({ name: "Pickup", type: "PICKUP" }),
      rule({ name: "Urgent Delivery", requiresFreeDeliveryItem: false }),
      rule({ name: "Free Delivery", requiresFreeDeliveryItem: true })
    ])).toBe(false);
  });

  it("does not nag a genuinely pickup-only shop", () => {
    expect(deliveryUnavailableWithoutTaggedItem([
      rule({ name: "Pickup", type: "PICKUP" })
    ])).toBe(false);
  });

  it("ignores inactive rules when deciding", () => {
    expect(deliveryUnavailableWithoutTaggedItem([
      rule({ name: "Urgent Delivery", requiresFreeDeliveryItem: true }),
      rule({ name: "Standard", requiresFreeDeliveryItem: false, active: false })
    ])).toBe(true);
  });
});
