import { describe, expect, it } from "vitest";
import { CommerceError } from "@/lib/commerce/errors";
import { MemoryCommerceRepository } from "@/lib/commerce/memory-repository";
import {
  blendUnitCost,
  createExpenseCategory,
  createMaterialPurchase,
  createProduct,
  createRawMaterial,
  createVariant,
  recordProductionRun,
  updateVariant,
  type CommerceActor,
  type CommerceContext
} from "@/lib/commerce/operations";

const owner: CommerceActor = { uid: "owner-1", roleIds: ["role-owner"] };

function createTestContext(): CommerceContext & { repo: MemoryCommerceRepository } {
  const repo = new MemoryCommerceRepository();
  let count = 0;
  return {
    repo,
    now: () => new Date("2026-09-08T00:00:00.000Z"),
    id: (prefix) => `${prefix}-${++count}`
  };
}

/** A bottled product: 100ml of liquid, one bottle, one label. */
async function seedRecipeProduct(context: CommerceContext) {
  const liquid = await createRawMaterial(context, owner, {
    name: "Mist base",
    unit: "ml",
    kind: "INGREDIENT",
    costPerUnit: 10,
    stockOnHand: 5000,
    lowStockThreshold: 500
  });
  const bottle = await createRawMaterial(context, owner, {
    name: "100ml bottle",
    unit: "piece",
    kind: "PACKAGING",
    costPerUnit: 200,
    stockOnHand: 40,
    lowStockThreshold: 10
  });

  const product = await createProduct(context, owner, {
    title: "Kitty Mist",
    slug: "kitty-mist",
    status: "ACTIVE",
    collectionIds: [],
    tags: [],
    mediaIds: [],
    featured: false
  });
  const variant = await createVariant(context, owner, {
    productId: product.id,
    title: "100ml",
    sku: "OMK-MIST-100",
    price: 10000,
    currency: "GHS",
    stockOnHand: 0,
    lowStockThreshold: 5,
    recipe: [
      { materialId: liquid.id, quantityPerUnit: 100 },
      { materialId: bottle.id, quantityPerUnit: 1 }
    ]
  });

  return { liquid, bottle, product, variant };
}

describe("blendUnitCost", () => {
  it("averages new stock against what is already held", () => {
    // 2 units at 30 each (60) plus 5 units for 200 => 260 over 7 units.
    expect(blendUnitCost(2, 30, 5, 200)).toBe(37);
  });

  it("uses the purchase price outright when nothing is in stock", () => {
    expect(blendUnitCost(0, 999, 4, 200)).toBe(50);
  });

  it("ignores negative stock rather than averaging against it", () => {
    // Records behind reality shouldn't corrupt the unit cost.
    expect(blendUnitCost(-10, 999, 4, 200)).toBe(50);
  });
});

describe("createMaterialPurchase", () => {
  it("raises stock and re-averages the unit cost", async () => {
    const context = createTestContext();
    const material = await createRawMaterial(context, owner, {
      name: "Glycerin",
      unit: "ml",
      costPerUnit: 30,
      stockOnHand: 2
    });

    const purchase = await createMaterialPurchase(context, owner, {
      materialId: material.id,
      quantity: 5,
      totalCost: 200,
      date: new Date("2026-09-08T00:00:00.000Z")
    });

    const updated = await context.repo.getRawMaterial(material.id);
    expect(updated?.stockOnHand).toBe(7);
    expect(updated?.costPerUnit).toBe(37);
    expect(purchase.unitCostAfter).toBe(37);
  });

  it("posts an expense only when a category is given", async () => {
    const context = createTestContext();
    const material = await createRawMaterial(context, owner, { name: "Caps", unit: "piece", costPerUnit: 0 });
    const category = await createExpenseCategory(context, owner, {
      title: "Raw materials",
      slug: "raw-materials",
      sortOrder: 0
    });

    const withoutExpense = await createMaterialPurchase(context, owner, {
      materialId: material.id,
      quantity: 10,
      totalCost: 500,
      date: new Date("2026-09-08T00:00:00.000Z")
    });
    expect(withoutExpense.expenseId).toBeNull();
    expect(await context.repo.listExpenses()).toHaveLength(0);

    const withExpense = await createMaterialPurchase(context, owner, {
      materialId: material.id,
      quantity: 10,
      totalCost: 500,
      date: new Date("2026-09-08T00:00:00.000Z"),
      expenseCategoryId: category.id
    });
    expect(withExpense.expenseId).not.toBeNull();
    expect(await context.repo.listExpenses()).toHaveLength(1);
  });

  it("re-costs every product whose recipe uses the material", async () => {
    const context = createTestContext();
    const { liquid, product, variant } = await seedRecipeProduct(context);

    // 100ml at 10 + one bottle at 200 = 1200 to start.
    expect((await context.repo.listVariants(product.id))[0].cost).toBe(1200);

    // Doubling the liquid's price should flow through without re-saving the product.
    await createMaterialPurchase(context, owner, {
      materialId: liquid.id,
      quantity: 5000,
      totalCost: 150_000,
      date: new Date("2026-09-08T00:00:00.000Z")
    });

    const refreshed = (await context.repo.listVariants(product.id)).find((entry) => entry.id === variant.id);
    expect(refreshed?.cost).toBe(2200); // 100ml at 20 + bottle at 200
  });
});

describe("recordProductionRun", () => {
  it("consumes materials, raises finished stock, and freezes the batch cost", async () => {
    const context = createTestContext();
    const { liquid, bottle, product, variant } = await seedRecipeProduct(context);

    const run = await recordProductionRun(context, owner, {
      productId: product.id,
      variantId: variant.id,
      quantityProduced: 10
    });

    expect((await context.repo.getRawMaterial(liquid.id))?.stockOnHand).toBe(4000);
    expect((await context.repo.getRawMaterial(bottle.id))?.stockOnHand).toBe(30);

    const produced = (await context.repo.listVariants(product.id)).find((entry) => entry.id === variant.id);
    expect(produced?.stockOnHand).toBe(10);

    expect(run.unitCost).toBe(1200);
    expect(run.totalCost).toBe(12_000);
    expect(run.shortfallMaterialNames).toEqual([]);
  });

  it("keeps a batch's cost even after material prices move", async () => {
    const context = createTestContext();
    const { liquid, product, variant } = await seedRecipeProduct(context);

    const run = await recordProductionRun(context, owner, {
      productId: product.id,
      variantId: variant.id,
      quantityProduced: 5
    });

    await createMaterialPurchase(context, owner, {
      materialId: liquid.id,
      quantity: 10_000,
      totalCost: 900_000,
      date: new Date("2026-09-08T00:00:00.000Z")
    });

    const stored = (await context.repo.listProductionRuns()).find((entry) => entry.id === run.id);
    expect(stored?.unitCost).toBe(1200);
  });

  it("records the shortfall instead of blocking when stock runs short", async () => {
    const context = createTestContext();
    const { bottle, product, variant } = await seedRecipeProduct(context);

    // Only 40 bottles on hand, so 50 units leaves it 10 short.
    const run = await recordProductionRun(context, owner, {
      productId: product.id,
      variantId: variant.id,
      quantityProduced: 50
    });

    expect(run.shortfallMaterialNames).toEqual(["100ml bottle"]);
    expect((await context.repo.getRawMaterial(bottle.id))?.stockOnHand).toBe(-10);

    const produced = (await context.repo.listVariants(product.id)).find((entry) => entry.id === variant.id);
    expect(produced?.stockOnHand).toBe(50);
  });

  it("refuses a variant that has no recipe", async () => {
    const context = createTestContext();
    const product = await createProduct(context, owner, {
      title: "Plain",
      slug: "plain",
      status: "ACTIVE",
      collectionIds: [],
      tags: [],
      mediaIds: [],
      featured: false
    });
    const variant = await createVariant(context, owner, {
      productId: product.id,
      title: "Default",
      sku: "OMK-PLAIN",
      price: 1000,
      currency: "GHS"
    });

    await expect(
      recordProductionRun(context, owner, { productId: product.id, variantId: variant.id, quantityProduced: 1 })
    ).rejects.toBeInstanceOf(CommerceError);
  });

  it("refuses a set, since a set is made from its component products", async () => {
    const context = createTestContext();
    const { product, variant } = await seedRecipeProduct(context);
    await updateVariant(context, owner, {
      productId: product.id,
      id: variant.id,
      bundleComponents: [{ variantId: "some-other-variant", quantity: 1 }]
    });

    await expect(
      recordProductionRun(context, owner, { productId: product.id, variantId: variant.id, quantityProduced: 1 })
    ).rejects.toBeInstanceOf(CommerceError);
  });
});
