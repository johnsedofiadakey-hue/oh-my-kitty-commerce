import { describe, expect, it } from "vitest";
import { CommerceError } from "@/lib/commerce/errors";
import { MemoryCommerceRepository } from "@/lib/commerce/memory-repository";
import {
  adjustInventory,
  attachProductImage,
  completeOnlineOrder,
  completePosSale,
  confirmPaystackPayment,
  createDeliveryRule,
  createExpense,
  createExpenseCategory,
  createOrderDraft,
  createPendingOnlineOrder,
  createProduct,
  createVariant,
  refundPosSale,
  setInventoryCount,
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

  it("applies a stock adjustment once when the same save arrives twice", async () => {
    const context = createTestContext();
    const { variant } = await seedProductAndVariant(context);
    const adjustment = {
      productId: variant.productId,
      variantId: variant.id,
      type: "STOCK_RECEIVED" as const,
      quantityDelta: 10,
      reason: "Restock",
      requestId: "press-of-save-0001"
    };

    const first = await adjustInventory(context, owner, adjustment);
    const second = await adjustInventory(context, owner, adjustment);

    expect(first.variant.stockAvailable).toBe(22);
    expect(second.movement.id).toBe(first.movement.id);
    await expect(context.repo.getVariant(variant.productId, variant.id)).resolves.toMatchObject({
      stockAvailable: 22,
      stockOnHand: 22
    });
    await expect(context.repo.listInventoryMovements(variant.id)).resolves.toHaveLength(1);

    // A different press of Save is a different request and does apply.
    await adjustInventory(context, owner, { ...adjustment, requestId: "press-of-save-0002" });
    await expect(context.repo.getVariant(variant.productId, variant.id)).resolves.toMatchObject({
      stockAvailable: 32
    });
  });

  it("lets stock be added to a negative count, but never removed below zero", async () => {
    const context = createTestContext();
    const { variant } = await seedProductAndVariant(context);
    const adjust = (quantityDelta: number) =>
      adjustInventory(context, owner, {
        productId: variant.productId,
        variantId: variant.id,
        type: "MANUAL_ADJUSTMENT",
        quantityDelta,
        reason: "Correction"
      });

    // Removing more than there is is refused and changes nothing.
    await expect(adjust(-13)).rejects.toThrow(/negative stock/);
    await expect(context.repo.getVariant(variant.productId, variant.id)).resolves.toMatchObject({ stockAvailable: 12 });

    // Put a variant into the negative the way past sales did, then repair it.
    await context.repo.saveVariant({ ...variant, stockOnHand: -160, stockAvailable: -160 });
    await expect(adjust(-1)).rejects.toThrow(/negative stock/);
    await expect(adjust(100)).resolves.toMatchObject({ variant: { stockAvailable: -60, stockOnHand: -60 } });
    await expect(adjust(70)).resolves.toMatchObject({ variant: { stockAvailable: 10 } });
  });

  it("sets the stock to a counted number and records the difference", async () => {
    const context = createTestContext();
    const { variant } = await seedProductAndVariant(context);
    const count = (value: number, requestId?: string) =>
      setInventoryCount(context, owner, {
        productId: variant.productId,
        variantId: variant.id,
        count: value,
        reason: "Stock count",
        requestId
      });

    // 12 in stock; the shelf really has 9.
    const down = await count(9, "count-press-0001");
    expect(down.variant.stockAvailable).toBe(9);
    expect(down.variant.stockOnHand).toBe(9);
    expect(down.movement).toMatchObject({ quantityDelta: -3, stockAfter: 9, type: "MANUAL_ADJUSTMENT" });

    // The same press again changes nothing.
    await count(9, "count-press-0001");
    await expect(context.repo.listInventoryMovements(variant.id)).resolves.toHaveLength(1);

    // Counting what is already there makes no movement.
    const same = await count(9);
    expect(same.movement).toBeNull();

    // A negative count is repaired by saying what is really there, however far off it was.
    await context.repo.saveVariant({ ...down.variant, stockOnHand: -135, stockAvailable: -135 });
    const repaired = await count(0);
    expect(repaired.variant.stockAvailable).toBe(0);
    expect(repaired.movement).toMatchObject({ quantityDelta: 135 });

    await expect(count(-1)).rejects.toThrow();
  });

  it("refuses a second variant that reuses an existing SKU, in any letter case", async () => {
    const context = createTestContext();
    const { product, variant } = await seedProductAndVariant(context);
    const otherProduct = await createProduct(context, owner, {
      title: "Kitty Oil",
      slug: "kitty-oil",
      status: "ACTIVE",
      collectionIds: [],
      tags: [],
      mediaIds: [],
      featured: false
    });
    const newVariant = (productId: string, sku: string) => ({
      productId,
      title: "Standard",
      sku,
      optionValues: {},
      price: 20000,
      currency: "GHS" as const,
      stockOnHand: 0,
      lowStockThreshold: 5
    });

    await expect(createVariant(context, owner, newVariant(otherProduct.id, variant.sku.toLowerCase()))).rejects.toThrow(
      /already used/
    );

    const other = await createVariant(context, owner, newVariant(otherProduct.id, "OMK-OIL"));
    await expect(updateVariant(context, owner, { productId: otherProduct.id, id: other.id, sku: variant.sku })).rejects.toThrow(
      /already used/
    );
    // Saving a variant again under its own SKU is not a clash.
    await expect(
      updateVariant(context, owner, { productId: otherProduct.id, id: other.id, sku: other.sku })
    ).resolves.toMatchObject({ sku: "OMK-OIL" });
    expect(product.id).not.toBe(otherProduct.id);
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

  it("selling a set draws from its components instead of its own stock", async () => {
    const context = createTestContext();
    const { component, kit } = await seedSetAndComponent(context);

    const sale = await completePosSale(context, salesStaff, {
      channel: "POS",
      idempotencyKey: "pos-sale-set-0001",
      items: [{ productId: kit.productId, variantId: kit.id, quantity: 1 }],
      paymentMethod: "cash",
      paymentProvider: "CASH",
      amountReceived: kit.price
    });

    expect(sale.inventoryMovements).toHaveLength(1);
    expect(sale.inventoryMovements[0]).toMatchObject({
      variantId: component.id,
      type: "BUNDLE_CONSUMED",
      quantityDelta: -2
    });

    // The set itself never had stock to begin with — selling one must not touch it.
    await expect(context.repo.getVariant(kit.productId, kit.id)).resolves.toMatchObject({
      stockAvailable: kit.stockAvailable
    });
    await expect(context.repo.getVariant(component.productId, component.id)).resolves.toMatchObject({
      stockAvailable: component.stockAvailable - 2
    });
  });

  it("blocks a set sale when a component can't cover it, without touching either variant's stock", async () => {
    const context = createTestContext();
    const { component, kit } = await seedSetAndComponent(context, { componentStock: 1 });

    await expect(
      completePosSale(context, salesStaff, {
        channel: "POS",
        idempotencyKey: "pos-sale-set-shortfall",
        items: [{ productId: kit.productId, variantId: kit.id, quantity: 1 }],
        paymentMethod: "cash",
        paymentProvider: "CASH",
        amountReceived: kit.price
      })
    ).rejects.toThrow(/does not have enough stock/);

    await expect(context.repo.getVariant(component.productId, component.id)).resolves.toMatchObject({
      stockAvailable: 1
    });
  });

  it("aggregates a shared component across order lines before checking stock, instead of validating each line alone", async () => {
    const context = createTestContext();
    // 2 per set, buying 2 sets = 4, plus 3 bought loose in the same order = 7 needed.
    const { component, kit } = await seedSetAndComponent(context, { componentStock: 7 });

    const sale = await completePosSale(context, salesStaff, {
      channel: "POS",
      idempotencyKey: "pos-sale-set-shared",
      items: [
        { productId: kit.productId, variantId: kit.id, quantity: 2 },
        { productId: component.productId, variantId: component.id, quantity: 3 }
      ],
      paymentMethod: "cash",
      paymentProvider: "CASH",
      amountReceived: kit.price * 2 + component.price * 3
    });

    // One movement for the set's draw (4) and one for the direct line (3) — not
    // silently merged, but the resulting stock reflects the combined total.
    expect(sale.inventoryMovements).toHaveLength(2);
    await expect(context.repo.getVariant(component.productId, component.id)).resolves.toMatchObject({
      stockAvailable: 0
    });
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

  it("refunding a set puts its components back, not the set's own stock", async () => {
    const context = createTestContext();
    const { component, kit } = await seedSetAndComponent(context);

    const sale = await completePosSale(context, owner, {
      channel: "POS",
      idempotencyKey: "pos-sale-set-refund-0001",
      items: [{ productId: kit.productId, variantId: kit.id, quantity: 3 }],
      paymentMethod: "cash",
      paymentProvider: "CASH",
      amountReceived: kit.price * 3
    });
    await expect(context.repo.getVariant(component.productId, component.id)).resolves.toMatchObject({
      stockAvailable: 4
    });

    const refund = await refundPosSale(context, owner, { orderId: sale.order.id, reason: "Changed their mind" });

    const refundMovements = refund.inventoryMovements ?? [];
    expect(refundMovements).toHaveLength(1);
    expect(refundMovements[0]).toMatchObject({
      variantId: component.id,
      type: "RETURN_TO_STOCK",
      quantityDelta: 6
    });
    await expect(context.repo.getVariant(component.productId, component.id)).resolves.toMatchObject({
      stockAvailable: 10,
      stockOnHand: 10
    });
    // The set never owned stock, so it must not gain any.
    await expect(context.repo.getVariant(kit.productId, kit.id)).resolves.toMatchObject({
      stockAvailable: kit.stockAvailable,
      stockOnHand: kit.stockOnHand
    });
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

  it("moves an online order to Processing once Paystack confirms payment", async () => {
    const context = createTestContext();
    const { variant } = await seedProductAndVariant(context);

    const pending = await createPendingOnlineOrder(context, {
      customerSnapshot: { name: "Ama", phone: "0241234567" },
      deliveryTotal: 0,
      taxTotal: 0,
      chargePaystackFee: false,
      idempotencyKey: "online-order-0001",
      items: [{ productId: variant.productId, variantId: variant.id, quantity: 1 }],
      paymentMethod: "card"
    });

    expect(pending.order.fulfilmentStatus).toBe("UNFULFILLED");

    const confirmed = await confirmPaystackPayment(context, {
      orderId: pending.order.id,
      providerReference: "paystack-ref-0001"
    });

    expect(confirmed.order.paymentStatus).toBe("PAID");
    expect(confirmed.order.fulfilmentStatus).toBe("PROCESSING");
  });
});

describe("expenses", () => {
  async function seedCategory(context: CommerceContext) {
    return createExpenseCategory(context, owner, { title: "Supplies", slug: "supplies", sortOrder: 0 });
  }

  it("stores what the expense was for alongside its category", async () => {
    const context = createTestContext();
    const category = await seedCategory(context);

    const expense = await createExpense(context, owner, {
      categoryId: category.id,
      name: "Bottles from supplier",
      amount: 15000,
      date: new Date("2026-01-05T00:00:00.000Z"),
      note: "Paid in cash"
    });

    expect(expense.name).toBe("Bottles from supplier");
    expect(expense.note).toBe("Paid in cash");
    expect((await context.repo.listExpenses())[0]?.name).toBe("Bottles from supplier");
  });

  it("still accepts an expense with no name, so older rows stay valid", async () => {
    const context = createTestContext();
    const category = await seedCategory(context);

    const expense = await createExpense(context, owner, {
      categoryId: category.id,
      amount: 5000,
      date: new Date("2026-01-05T00:00:00.000Z")
    });

    expect(expense.name).toBeUndefined();
  });

  it("rejects an expense pointing at a category that does not exist", async () => {
    const context = createTestContext();

    await expect(
      createExpense(context, owner, {
        categoryId: "missing",
        amount: 5000,
        date: new Date("2026-01-05T00:00:00.000Z")
      })
    ).rejects.toBeInstanceOf(CommerceError);
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

/** A "set" (Chronic Infection Set-style) that needs 2 of one component per unit sold. */
async function seedSetAndComponent(context: CommerceContext, options: { componentStock?: number } = {}) {
  const componentProduct = await createProduct(context, owner, {
    title: "Feminine Wash",
    slug: "feminine-wash",
    status: "ACTIVE",
    collectionIds: [],
    tags: [],
    mediaIds: [],
    featured: false
  });
  const component = await createVariant(context, owner, {
    productId: componentProduct.id,
    title: "Standard",
    sku: "OMK-WASH",
    optionValues: {},
    price: 9000,
    currency: "GHS",
    stockOnHand: options.componentStock ?? 10,
    lowStockThreshold: 5
  });

  const kitProduct = await createProduct(context, owner, {
    title: "Chronic Infection Set",
    slug: "chronic-infection-set",
    status: "ACTIVE",
    collectionIds: [],
    tags: [],
    mediaIds: [],
    featured: false
  });
  const kit = await createVariant(context, owner, {
    productId: kitProduct.id,
    title: "Standard",
    sku: "OMK-SET",
    optionValues: {},
    price: 69000,
    currency: "GHS",
    bundleComponents: [{ variantId: component.id, quantity: 2 }],
    stockOnHand: 0,
    lowStockThreshold: 5
  });

  return { componentProduct, component, kitProduct, kit };
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
