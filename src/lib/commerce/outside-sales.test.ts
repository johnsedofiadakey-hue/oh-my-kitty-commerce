import { describe, expect, it } from "vitest";
import { MemoryCommerceRepository } from "@/lib/commerce/memory-repository";
import {
  createProduct,
  createVariant,
  findOrdersByPaymentReference,
  packOrder,
  recordOutsideSale,
  searchOrders,
  type CommerceActor,
  type CommerceContext
} from "@/lib/commerce/operations";

const owner: CommerceActor = { uid: "owner-1", roleIds: ["role-owner"] };
const salesStaff: CommerceActor = { uid: "staff-1", roleIds: ["role-sales-staff"] };

function createTestContext(): CommerceContext & { repo: MemoryCommerceRepository } {
  const repo = new MemoryCommerceRepository();
  let count = 0;

  return {
    repo,
    roles: [],
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    id: (prefix) => `${prefix}-${++count}`
  };
}

async function seedVariant(context: CommerceContext) {
  const product = await createProduct(context, owner, {
    title: "Feminine Wash",
    slug: "feminine-wash",
    status: "ACTIVE",
    collectionIds: [],
    tags: [],
    mediaIds: [],
    featured: false
  });

  return createVariant(context, owner, {
    productId: product.id,
    title: "250ml",
    sku: "OMK-FW-250",
    optionValues: { size: "250ml" },
    price: 9000,
    currency: "GHS",
    stockOnHand: 20,
    lowStockThreshold: 2
  });
}

function saleInput(variant: { productId: string; id: string }, overrides: Record<string, unknown> = {}) {
  return {
    channel: "ADMIN_CREATED" as const,
    customerSnapshot: { name: "Ama", phone: "0241448231", address: "East Legon" },
    deliveryTotal: 0,
    idempotencyKey: `outside-${Math.random().toString(36).slice(2, 12)}`,
    items: [{ productId: variant.productId, variantId: variant.id, quantity: 1 }],
    paymentMethod: "mobile_money" as const,
    paymentProvider: "MANUAL" as const,
    taxTotal: 0,
    ...overrides
  };
}

describe("recording a sale paid by MoMo off the website", () => {
  it("leaves the order unfulfilled so it reaches the dispatch queue", async () => {
    // The whole point: a counter sale is FULFILLED on payment because the
    // customer walks away holding it. This one still has to be packed, and if
    // it were born FULFILLED no parcel would ever record that it was sent.
    const context = createTestContext();
    const variant = await seedVariant(context);

    const sale = await recordOutsideSale(context, owner, saleInput(variant));

    expect(sale.order.channel).toBe("ADMIN_CREATED");
    expect(sale.order.paymentStatus).toBe("PAID");
    expect(sale.order.fulfilmentStatus).toBe("UNFULFILLED");
  });

  it("can then be packed, which is the proof a dispute turns on", async () => {
    const context = createTestContext();
    const variant = await seedVariant(context);
    const sale = await recordOutsideSale(context, owner, saleInput(variant));

    const parcel = await packOrder(context, owner, { orderId: sale.order.id });

    expect(parcel.status).toBe("PACKED");
    expect(parcel.packedBy).toBe(owner.uid);
    expect(parcel.orderNumber).toBe(sale.order.orderNumber);

    const reloaded = await context.repo.getOrder(sale.order.id);
    expect(reloaded?.fulfilmentStatus).toBe("PACKED");
  });

  it("records where the money came from and which wallet took it", async () => {
    const context = createTestContext();
    const variant = await seedVariant(context);

    await recordOutsideSale(
      context,
      owner,
      saleInput(variant, {
        paymentReference: "MP260101.1234.A56789",
        payerNumber: "054 777 1234",
        receivedInto: "Personal MoMo | 0241448231"
      })
    );

    const [payment] = await context.repo.listPayments();
    expect(payment.providerReference).toBe("MP260101.1234.A56789");
    // Stored normalised, so it matches however the payer's number is typed later.
    expect(payment.payerNumber).toBe("233547771234");
    expect(payment.receivedInto).toBe("Personal MoMo | 0241448231");
    expect(payment.method).toBe("mobile_money");
    expect(payment.provider).toBe("MANUAL");
  });

  it("refuses a reference that already paid for another order", async () => {
    const context = createTestContext();
    const variant = await seedVariant(context);
    const first = await recordOutsideSale(
      context,
      owner,
      saleInput(variant, { paymentReference: "MP260101.1234.A56789" })
    );

    await expect(
      recordOutsideSale(context, owner, saleInput(variant, { paymentReference: "MP260101.1234.A56789" }))
    ).rejects.toThrow(first.order.orderNumber);
  });

  it("allows the same reference through once staff have looked and confirmed", async () => {
    const context = createTestContext();
    const variant = await seedVariant(context);
    await recordOutsideSale(context, owner, saleInput(variant, { paymentReference: "DUP-1" }));

    const second = await recordOutsideSale(
      context,
      owner,
      saleInput(variant, { paymentReference: "DUP-1", allowDuplicateReference: true })
    );

    expect(second.order.fulfilmentStatus).toBe("UNFULFILLED");
  });

  it("insists on a phone number, since that is how the customer gets their receipt", async () => {
    const context = createTestContext();
    const variant = await seedVariant(context);

    await expect(
      recordOutsideSale(context, owner, saleInput(variant, { customerSnapshot: { name: "Ama" } }))
    ).rejects.toThrow(/phone number is required/i);
  });

  it("lets sales staff record one without granting them order-status powers", async () => {
    const context = createTestContext();
    const variant = await seedVariant(context);

    const sale = await recordOutsideSale(context, salesStaff, saleInput(variant));
    expect(sale.order.channel).toBe("ADMIN_CREATED");
  });
});

describe("finding the order a screenshot already paid for", () => {
  it("finds it by the MoMo transaction id", async () => {
    const context = createTestContext();
    const variant = await seedVariant(context);
    const sale = await recordOutsideSale(
      context,
      owner,
      saleInput(variant, { paymentReference: "MP260101.1234.A56789" })
    );

    const found = await searchOrders(context, owner, "MP260101.1234.A56789");
    expect(found.map((order) => order.orderNumber)).toEqual([sale.order.orderNumber]);
  });

  it("finds it by the number that paid, however that number is typed", async () => {
    const context = createTestContext();
    const variant = await seedVariant(context);
    const sale = await recordOutsideSale(context, owner, saleInput(variant, { payerNumber: "0547771234" }));

    for (const typed of ["0547771234", "+233547771234", "233547771234", "054 777 1234"]) {
      const found = await searchOrders(context, owner, typed);
      expect(found.map((order) => order.orderNumber), `searching ${typed}`).toEqual([sale.order.orderNumber]);
    }
  });

  it("finds it by the customer's phone in a format other than the stored one", async () => {
    const context = createTestContext();
    const variant = await seedVariant(context);
    const sale = await recordOutsideSale(context, owner, saleInput(variant));

    const found = await searchOrders(context, owner, "+233241448231");
    expect(found.map((order) => order.orderNumber)).toEqual([sale.order.orderNumber]);
  });

  it("still finds it by order number and customer name", async () => {
    const context = createTestContext();
    const variant = await seedVariant(context);
    const sale = await recordOutsideSale(context, owner, saleInput(variant));

    await expect(searchOrders(context, owner, sale.order.orderNumber)).resolves.toHaveLength(1);
    await expect(searchOrders(context, owner, "ama")).resolves.toHaveLength(1);
  });

  it("returns nothing for a reference that was never used", async () => {
    const context = createTestContext();
    const variant = await seedVariant(context);
    await recordOutsideSale(context, owner, saleInput(variant, { paymentReference: "REAL-1" }));

    await expect(findOrdersByPaymentReference(context, owner, "NOT-A-REAL-ONE")).resolves.toEqual([]);
    await expect(findOrdersByPaymentReference(context, owner, "   ")).resolves.toEqual([]);
  });
});
