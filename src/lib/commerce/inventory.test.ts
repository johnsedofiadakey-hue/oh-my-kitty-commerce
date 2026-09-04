import { describe, expect, it } from "vitest";
import { computeAvailableStock, isSetVariant } from "@/lib/commerce/inventory";
import type { ProductVariant } from "@/lib/commerce/types";

function makeVariant(overrides: Partial<ProductVariant>): ProductVariant {
  return {
    id: "variant-x",
    productId: "product-x",
    title: "Default",
    sku: "sku-x",
    optionValues: {},
    price: 1000,
    currency: "GHS",
    mediaIds: [],
    trackInventory: true,
    stockOnHand: 0,
    stockAvailable: 0,
    lowStockThreshold: 5,
    active: true,
    ...overrides
  };
}

describe("computeAvailableStock", () => {
  it("reports a plain product's own stockAvailable, unchanged", () => {
    const variant = makeVariant({ stockAvailable: 7 });
    expect(computeAvailableStock(variant, new Map())).toBe(7);
    expect(isSetVariant(variant)).toBe(false);
  });

  it("is limited by the scarcest component, floored to whole sets", () => {
    const wash = makeVariant({ id: "wash", stockAvailable: 9 });
    const oil = makeVariant({ id: "oil", stockAvailable: 3 });
    const set = makeVariant({
      id: "set",
      bundleComponents: [
        { variantId: "wash", quantity: 1 },
        { variantId: "oil", quantity: 2 }
      ]
    });
    const variantsById = new Map([
      ["wash", wash],
      ["oil", oil],
      ["set", set]
    ]);

    // wash covers 9 sets, oil covers floor(3/2) = 1 set — the binding constraint.
    expect(computeAvailableStock(set, variantsById)).toBe(1);
    expect(isSetVariant(set)).toBe(true);
  });

  it("treats a missing or untracked component as zero, not as unlimited", () => {
    const missingComponentSet = makeVariant({
      id: "set-a",
      bundleComponents: [{ variantId: "does-not-exist", quantity: 1 }]
    });
    expect(computeAvailableStock(missingComponentSet, new Map())).toBe(0);

    const untracked = makeVariant({ id: "untracked", trackInventory: false, stockAvailable: 0 });
    const tracked = makeVariant({ id: "tracked", stockAvailable: 4 });
    const setWithOneUntracked = makeVariant({
      id: "set-b",
      bundleComponents: [
        { variantId: "untracked", quantity: 1 },
        { variantId: "tracked", quantity: 1 }
      ]
    });
    const variantsById = new Map([
      ["untracked", untracked],
      ["tracked", tracked],
      ["set-b", setWithOneUntracked]
    ]);

    // The untracked component doesn't constrain availability — only the tracked one does.
    expect(computeAvailableStock(setWithOneUntracked, variantsById)).toBe(4);
  });

  it("never goes negative", () => {
    const wash = makeVariant({ id: "wash", stockAvailable: 0 });
    const set = makeVariant({ id: "set", bundleComponents: [{ variantId: "wash", quantity: 1 }] });
    const variantsById = new Map([
      ["wash", wash],
      ["set", set]
    ]);

    expect(computeAvailableStock(set, variantsById)).toBe(0);
  });
});
