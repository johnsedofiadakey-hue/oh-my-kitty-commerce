import { describe, expect, it } from "vitest";
import { CommerceError } from "@/lib/commerce/errors";
import { MemoryCommerceRepository } from "@/lib/commerce/memory-repository";
import {
  adjustInventory,
  attachProductImage,
  completeOnlineOrder,
  completePosSale,
  createDeliveryRule,
  createOrderDraft,
  createProduct,
  createVariant,
  refundPosSale,
  searchOrders,
  updateContentBlock,
  updateDeliveryRule,
  updateProduct,
  updateVariant,
  voidPosSale,
  type CommerceActor,
  type CommerceContext
} from "@/lib/commerce/operations";
import type { Role } from "@/lib/permissions/permissions";

const owner: CommerceActor = {
  uid: "owner-1",
  roleIds: ["role-owner"]
};

const salesStaff: CommerceActor = {
  uid: "staff-1",
  roleIds: ["role-sales-staff"]
};

const cashierRole: Role = {
  id: "role-cashier",
  name: "Cashier",
  permissions: ["pos.access", "pos.sell", "pos.refund", "pos.void", "pos.shift.open", "pos.shift.close"],
  limits: { maxRefundAmount: 5000 }
};

const cashier: CommerceActor = {
  uid: "cashier-1",
  roleIds: ["role-cashier"]
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

  it("leaves omitted fields untouched on a partial product update instead of resetting them", async () => {
    const context = createTestContext();
    const { product } = await seedProductAndVariant(context);

    const updated = await updateProduct(context, owner, {
      id: product.id,
      status: "ACTIVE"
    });

    expect(updated.status).toBe("ACTIVE");
    expect(updated.categoryIds).toEqual(["cat-wellness"]);
    expect(updated.collectionIds).toEqual(["collection-hero"]);
    expect(updated.tags).toEqual(["botanical"]);
    expect(updated.featured).toBe(true);
  });

  it("leaves omitted fields untouched on a partial variant update instead of resetting stock", async () => {
    const context = createTestContext();
    const { variant } = await seedProductAndVariant(context);

    // A price-only update must not trip the "use adjustInventory" guard —
    // it would if the schema silently filled in stockOnHand/stockAvailable
    // defaults for the fields this call never mentioned.
    const updated = await updateVariant(context, owner, {
      productId: variant.productId,
      id: variant.id,
      price: 15000
    });

    expect(updated.price).toBe(15000);
    expect(updated.stockOnHand).toBe(variant.stockOnHand);
    expect(updated.stockAvailable).toBe(variant.stockAvailable);
  });

  it("leaves omitted fields untouched on a partial delivery rule update", async () => {
    const context = createTestContext();
    const rule = await createDeliveryRule(context, owner, {
      name: "Urgent Delivery",
      type: "NATIONWIDE_DELIVERY",
      sortOrder: 2,
      estimate: "2 days"
    });

    const updated = await updateDeliveryRule(context, owner, {
      id: rule.id,
      estimate: "2 days · fee paid to courier"
    });

    expect(updated.estimate).toBe("2 days · fee paid to courier");
    expect(updated.sortOrder).toBe(2);
    expect(updated.active).toBe(true);
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

  it("refunds a POS sale within the actor's limit and restocks inventory", async () => {
    const context = createTestContext();
    const { variant } = await seedProductAndVariant(context);
    const sale = await sellTwoUnits(context, owner);

    const refund = await refundPosSale(context, owner, {
      orderId: sale.order.id,
      reason: "Customer changed their mind"
    });

    expect(refund.idempotent).toBe(false);
    expect(refund.order.status).toBe("REFUNDED");
    expect(refund.order.paymentStatus).toBe("REFUNDED");
    await expect(context.repo.getVariant(variant.productId, variant.id)).resolves.toMatchObject({
      stockAvailable: 12
    });

    const repeat = await refundPosSale(context, owner, {
      orderId: sale.order.id,
      reason: "Customer changed their mind"
    });
    expect(repeat.idempotent).toBe(true);
  });

  it("requires manager approval when a refund exceeds the actor's limit", async () => {
    const context = createTestContext();
    await seedProductAndVariant(context);
    const sale = await sellTwoUnits(context, cashier);

    await expect(
      refundPosSale(context, cashier, {
        orderId: sale.order.id,
        reason: "Customer changed their mind"
      })
    ).rejects.toThrow(/manager/i);

    const approved = await refundPosSale(
      context,
      cashier,
      { orderId: sale.order.id, reason: "Customer changed their mind" },
      owner
    );

    expect(approved.order.status).toBe("REFUNDED");
    await expect(context.repo.listAuditLogs()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "pos.refund",
          reason: expect.stringContaining("approved by owner-1")
        })
      ])
    );
  });

  it("rejects an approver whose own limit can't cover the refund", async () => {
    const context = createTestContext();
    await seedProductAndVariant(context);
    const sale = await sellTwoUnits(context, cashier);
    const otherCashier: CommerceActor = { uid: "cashier-2", roleIds: ["role-cashier"] };

    await expect(
      refundPosSale(
        context,
        cashier,
        { orderId: sale.order.id, reason: "Customer changed their mind" },
        otherCashier
      )
    ).rejects.toThrow(/limit/i);
  });

  it("voids a POS sale, cancelling the order instead of marking it refunded", async () => {
    const context = createTestContext();
    const { variant } = await seedProductAndVariant(context);
    const sale = await sellTwoUnits(context, owner);

    const voided = await voidPosSale(context, owner, {
      orderId: sale.order.id,
      reason: "Rang up the wrong item"
    });

    expect(voided.order.status).toBe("CANCELLED");
    expect(voided.order.fulfilmentStatus).toBe("CANCELLED");
    expect(voided.order.paymentStatus).toBe("REFUNDED");
    await expect(context.repo.getVariant(variant.productId, variant.id)).resolves.toMatchObject({
      stockAvailable: 12
    });
  });

  it("does not restock inventory when restock is false", async () => {
    const context = createTestContext();
    const { variant } = await seedProductAndVariant(context);
    const sale = await sellTwoUnits(context, owner);

    await refundPosSale(context, owner, {
      orderId: sale.order.id,
      reason: "Item was damaged",
      restock: false
    });

    await expect(context.repo.getVariant(variant.productId, variant.id)).resolves.toMatchObject({
      stockAvailable: 10
    });
    await expect(context.repo.listInventoryMovements(variant.id)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "REFUND_NO_STOCK_RETURN", quantityDelta: 0 })])
    );
  });

  it("blocks refunds on orders that were not sold through POS", async () => {
    const context = createTestContext();
    const { variant } = await seedProductAndVariant(context);
    const sale = await completeOnlineOrder(context, {
      channel: "ONLINE",
      idempotencyKey: "online-refund-target",
      items: [{ productId: variant.productId, variantId: variant.id, quantity: 1 }],
      paymentMethod: "manual_transfer",
      paymentProvider: "TBD"
    });

    await expect(
      refundPosSale(context, owner, { orderId: sale.order.id, reason: "n/a" })
    ).rejects.toThrow(/POS/);
  });

  it("blocks refund/void for actors without the pos.refund/pos.void permission", async () => {
    const context = createTestContext();
    await seedProductAndVariant(context);
    const sale = await sellTwoUnits(context, owner);

    await expect(
      refundPosSale(context, salesStaff, { orderId: sale.order.id, reason: "n/a" })
    ).rejects.toThrow(/pos.refund/);
    await expect(
      voidPosSale(context, salesStaff, { orderId: sale.order.id, reason: "n/a" })
    ).rejects.toThrow(/pos.void/);
  });

  it("finds an order by order number or customer phone/name, and requires permission", async () => {
    const context = createTestContext();
    await seedProductAndVariant(context);
    const sale = await sellTwoUnits(context, owner);

    await expect(searchOrders(context, salesStaff, sale.order.orderNumber)).resolves.toEqual([
      expect.objectContaining({ id: sale.order.id })
    ]);
    await expect(searchOrders(context, salesStaff, "no-such-order")).resolves.toEqual([]);
    await expect(searchOrders(context, salesStaff, "")).resolves.toEqual([]);

    const noPermission: CommerceActor = { uid: "nobody-1", roleIds: [] };
    await expect(searchOrders(context, noPermission, sale.order.orderNumber)).rejects.toThrow(
      /pos.receipts.view/
    );
  });

  it("updates a content block and leaves other blocks untouched", async () => {
    const context = createTestContext();

    const first = await updateContentBlock(context, owner, {
      key: "whatsapp-number",
      value: "0200000000"
    });
    expect(first.value).toBe("0200000000");

    await expect(context.repo.listContentBlocks()).resolves.toEqual([
      expect.objectContaining({ key: "whatsapp-number", value: "0200000000" })
    ]);
  });

  it("attaches an uploaded image as the variant's primary photo", async () => {
    const context = createTestContext();
    const { variant } = await seedProductAndVariant(context);

    const result = await attachProductImage(context, owner, {
      productId: variant.productId,
      variantId: variant.id,
      storagePath: `products/${variant.productId}/${variant.id}-1.jpg`,
      url: "https://example.com/photo.jpg",
      alt: "Slippery Elm"
    });

    expect(result.variant.mediaIds).toEqual([result.asset.id]);
    await expect(context.repo.listMedia()).resolves.toEqual([
      expect.objectContaining({ url: "https://example.com/photo.jpg", visibility: "PUBLIC" })
    ]);
  });
});

function createTestContext(): CommerceContext & { repo: MemoryCommerceRepository } {
  const repo = new MemoryCommerceRepository();
  let count = 0;

  return {
    repo,
    roles: [cashierRole],
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

async function sellTwoUnits(context: CommerceContext, actor: CommerceActor) {
  const products = await context.repo.listProducts();
  const product = products[0];
  const variants = await context.repo.listVariants(product.id);
  const variant = variants[0];

  return completePosSale(context, actor, {
    channel: "POS",
    idempotencyKey: `pos-sale-${actor.uid}-${Math.random().toString(36).slice(2, 8)}`,
    items: [{ productId: variant.productId, variantId: variant.id, quantity: 2 }],
    paymentMethod: "cash",
    paymentProvider: "CASH",
    amountReceived: variant.price * 2
  });
}
