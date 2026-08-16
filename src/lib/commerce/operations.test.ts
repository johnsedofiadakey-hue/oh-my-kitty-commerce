import { describe, expect, it } from "vitest";
import { CommerceError } from "@/lib/commerce/errors";
import { MemoryCommerceRepository } from "@/lib/commerce/memory-repository";
import {
  adjustInventory,
  completeOnlineOrder,
  completePosSale,
  createOrderDraft,
  createProduct,
  createVariant,
  type CommerceActor,
  type CommerceContext
} from "@/lib/commerce/operations";

const owner: CommerceActor = {
  uid: "owner-1",
  roleIds: ["role-owner"]
};

const salesStaff: CommerceActor = {
  uid: "staff-1",
  roleIds: ["role-sales-staff"]
};

describe("commerce operations", () => {
  it("creates products and variants through permission-checked operations", async () => {
    const context = createTestContext();
    const { product, variant } = await seedProductAndVariant(context);

    expect(product.id).toBe("product-slippery-elm");
    expect(variant.id).toBe("variant-omk-se-30");
    expect(variant.stockAvailable).toBe(12);
    await expect(context.repo.listAuditLogs()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "products.create" }),
        expect.objectContaining({ action: "variants.create" })
      ])
    );
  });

  it("requires inventory permission for stock adjustments and ledgers changes", async () => {
    const context = createTestContext();
    const { variant } = await seedProductAndVariant(context);

    await expect(
      adjustInventory(context, salesStaff, {
        productId: variant.productId,
        variantId: variant.id,
        type: "STOCK_RECEIVED",
        quantityDelta: 4,
        reason: "Restock"
      })
    ).rejects.toThrow(CommerceError);

    const adjustment = await adjustInventory(context, owner, {
      productId: variant.productId,
      variantId: variant.id,
      type: "STOCK_RECEIVED",
      quantityDelta: 4,
      reason: "Restock"
    });

    expect(adjustment.variant.stockAvailable).toBe(16);
    expect(adjustment.movement.quantityDelta).toBe(4);
    expect(adjustment.movement.type).toBe("STOCK_RECEIVED");
  });

  it("completes POS sales against shared inventory with idempotency", async () => {
    const context = createTestContext();
    const { variant } = await seedProductAndVariant(context);

    const sale = await completePosSale(context, salesStaff, {
      channel: "POS",
      idempotencyKey: "pos-sale-0001",
      items: [
        {
          productId: variant.productId,
          variantId: variant.id,
          quantity: 2
        }
      ],
      paymentMethod: "cash",
      paymentProvider: "CASH",
      amountReceived: 24000
    });

    expect(sale.idempotent).toBe(false);
    expect(sale.order.channel).toBe("POS");
    expect(sale.order.status).toBe("PAID");
    expect(sale.order.paymentStatus).toBe("PAID");
    expect(sale.inventoryMovements).toHaveLength(1);
    expect(sale.inventoryMovements[0]).toMatchObject({
      type: "POS_SALE",
      quantityDelta: -2,
      channel: "POS"
    });
    await expect(context.repo.getVariant(variant.productId, variant.id)).resolves.toMatchObject({
      stockAvailable: 10
    });

    const repeatedSale = await completePosSale(context, salesStaff, {
      channel: "POS",
      idempotencyKey: "pos-sale-0001",
      items: [
        {
          productId: variant.productId,
          variantId: variant.id,
          quantity: 2
        }
      ],
      paymentMethod: "cash",
      paymentProvider: "CASH",
      amountReceived: 24000
    });

    expect(repeatedSale.idempotent).toBe(true);
    expect(repeatedSale.inventoryMovements).toHaveLength(0);
    expect(context.repo.orders.size).toBe(1);
  });

  it("blocks POS discounts when the staff role lacks discount permission", async () => {
    const context = createTestContext();
    const { variant } = await seedProductAndVariant(context);

    await expect(
      completePosSale(context, salesStaff, {
        channel: "POS",
        idempotencyKey: "pos-sale-discount",
        items: [
          {
            productId: variant.productId,
            variantId: variant.id,
            quantity: 1,
            discountTotal: 100
          }
        ],
        paymentMethod: "cash",
        paymentProvider: "CASH",
        amountReceived: 11900
      })
    ).rejects.toThrow(/pos.discount/);
  });

  it("keeps online sale channel separate from payment and fulfilment status", async () => {
    const context = createTestContext();
    const { variant } = await seedProductAndVariant(context);

    const sale = await completeOnlineOrder(context, {
      channel: "ONLINE",
      idempotencyKey: "online-sale-0001",
      items: [
        {
          productId: variant.productId,
          variantId: variant.id,
          quantity: 1
        }
      ],
      paymentMethod: "manual_transfer",
      paymentProvider: "TBD"
    });

    expect(sale.order.channel).toBe("ONLINE");
    expect(sale.order.status).toBe("PAID");
    expect(sale.order.fulfilmentStatus).toBe("UNFULFILLED");
    expect(sale.inventoryMovements[0]).toMatchObject({
      type: "ONLINE_SALE",
      actorId: "system:online-checkout"
    });
  });

  it("creates admin draft orders without moving inventory", async () => {
    const context = createTestContext();
    const { variant } = await seedProductAndVariant(context);

    const draft = await createOrderDraft(context, owner, {
      channel: "ADMIN_CREATED",
      idempotencyKey: "admin-draft-0001",
      items: [
        {
          productId: variant.productId,
          variantId: variant.id,
          quantity: 1
        }
      ]
    });

    expect(draft.status).toBe("DRAFT");
    expect(draft.channel).toBe("ADMIN_CREATED");
    await expect(context.repo.listInventoryMovements(variant.id)).resolves.toHaveLength(0);
  });
});

function createTestContext(): CommerceContext & { repo: MemoryCommerceRepository } {
  const repo = new MemoryCommerceRepository();
  let count = 0;

  return {
    repo,
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    id: (prefix) => `${prefix}-${++count}`
  };
}

async function seedProductAndVariant(context: CommerceContext) {
  const product = await createProduct(context, owner, {
    title: "Slippery Elm",
    slug: "slippery-elm",
    status: "ACTIVE",
    categoryIds: ["cat-wellness"],
    collectionIds: ["collection-hero"],
    tags: ["botanical"],
    mediaIds: [],
    featured: true
  });
  const variant = await createVariant(context, owner, {
    productId: product.id,
    title: "30 Capsules",
    sku: "OMK-SE-30",
    optionValues: { size: "30 Capsules" },
    price: 12000,
    currency: "GHS",
    stockOnHand: 12,
    lowStockThreshold: 5
  });

  return { product, variant };
}
