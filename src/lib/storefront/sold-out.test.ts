import { describe, expect, it } from "vitest";
import { isSoldOut } from "@/lib/storefront/catalogue";
import type { ProductVariant } from "@/lib/commerce/types";

function variant(overrides: Partial<ProductVariant>): ProductVariant {
  return {
    id: "variant-a",
    productId: "product-a",
    title: "Default",
    sku: "A",
    optionValues: {},
    price: 1000,
    currency: "GHS",
    mediaIds: [],
    trackInventory: true,
    stockOnHand: 5,
    stockAvailable: 5,
    lowStockThreshold: 5,
    active: true,
    ...overrides
  };
}

const lookup = (...variants: ProductVariant[]) => new Map(variants.map((entry) => [entry.id, entry]));

describe("isSoldOut", () => {
  it("is sold out at zero and when the count has gone negative, not before", () => {
    const some = variant({ stockAvailable: 1, stockOnHand: 1 });
    const none = variant({ stockAvailable: 0, stockOnHand: 0 });
    const negative = variant({ stockAvailable: -5, stockOnHand: -5 });

    expect(isSoldOut(some, lookup(some))).toBe(false);
    expect(isSoldOut(none, lookup(none))).toBe(true);
    expect(isSoldOut(negative, lookup(negative))).toBe(true);
  });

  it("never calls a product sold out when its stock isn't tracked", () => {
    const untracked = variant({ trackInventory: false, stockAvailable: 0, stockOnHand: 0 });

    expect(isSoldOut(untracked, lookup(untracked))).toBe(false);
  });

  it("calls a set sold out when any tracked component can't cover one", () => {
    const wash = variant({ id: "wash", stockAvailable: 10, stockOnHand: 10 });
    const oil = variant({ id: "oil", stockAvailable: 0, stockOnHand: 0 });
    const set = variant({
      id: "set",
      stockAvailable: 0,
      stockOnHand: 0,
      bundleComponents: [
        { variantId: "wash", quantity: 1 },
        { variantId: "oil", quantity: 1 }
      ]
    });

    expect(isSoldOut(set, lookup(wash, oil, set))).toBe(true);
    const restockedOil = { ...oil, stockAvailable: 3, stockOnHand: 3 };
    expect(isSoldOut(set, lookup(wash, restockedOil, set))).toBe(false);
  });

  it("doesn't call a set sold out when none of its components are tracked", () => {
    const gift = variant({ id: "gift", trackInventory: false, stockAvailable: 0, stockOnHand: 0 });
    const set = variant({ id: "set", bundleComponents: [{ variantId: "gift", quantity: 1 }] });

    expect(isSoldOut(set, lookup(gift, set))).toBe(false);
  });
});
