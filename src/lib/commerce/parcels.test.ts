import { describe, expect, it } from "vitest";
import { CommerceError } from "@/lib/commerce/errors";
import { MemoryCommerceRepository } from "@/lib/commerce/memory-repository";
import {
  completeOnlineOrder,
  createProduct,
  createVariant,
  dispatchParcels,
  holdOrderPacking,
  markParcelDelivered,
  packOrder,
  returnParcel,
  updateOrderFulfilment,
  type CommerceActor,
  type CommerceContext
} from "@/lib/commerce/operations";
import type { Role } from "@/lib/permissions/permissions";

const owner: CommerceActor = { uid: "owner-1", roleIds: ["role-owner"], displayName: "Owner" };

/** Mirrors the real Sales Staff role: can pack and dispatch, cannot return or override. */
const packerRole: Role = {
  id: "role-packer",
  name: "Packer",
  permissions: ["parcels.pack", "parcels.dispatch", "orders.view", "fulfilment.view"]
};
const packer: CommerceActor = { uid: "packer-1", roleIds: ["role-packer"], displayName: "Ama" };

function createTestContext(): CommerceContext & { repo: MemoryCommerceRepository } {
  const repo = new MemoryCommerceRepository();
  let count = 0;
  return {
    repo,
    roles: [packerRole],
    now: () => new Date("2026-09-18T10:00:00.000Z"),
    id: (prefix) => `${prefix}-${++count}`
  };
}

async function seedPaidOrder(context: CommerceContext) {
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
    stockOnHand: 20,
    stockAvailable: 20,
    lowStockThreshold: 5
  });

  const sale = await completeOnlineOrder(context, {
    channel: "ONLINE",
    items: [{ productId: product.id, variantId: variant.id, quantity: 2 }],
    customerSnapshot: { name: "Sarah", phone: "0240000000", address: "Madina" },
    idempotencyKey: `order-${Math.random().toString(36).slice(2, 10)}`,
    paymentMethod: "manual_transfer",
    paymentProvider: "TBD"
  });

  return { product, variant, order: sale.order };
}

/** A set: one order line, several things to physically pick. */
async function seedPaidSetOrder(context: CommerceContext) {
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
    title: "100ml",
    sku: "OMK-WASH-100",
    price: 5000,
    currency: "GHS",
    stockOnHand: 50,
    stockAvailable: 50
  });

  const setProduct = await createProduct(context, owner, {
    title: "Chronic Infection Set",
    slug: "chronic-infection-set",
    status: "ACTIVE",
    collectionIds: [],
    tags: [],
    mediaIds: [],
    featured: false
  });
  const setVariant = await createVariant(context, owner, {
    productId: setProduct.id,
    title: "Default",
    sku: "OMK-SET",
    price: 69000,
    currency: "GHS",
    bundleComponents: [{ variantId: component.id, quantity: 3 }]
  });

  const sale = await completeOnlineOrder(context, {
    channel: "ONLINE",
    items: [{ productId: setProduct.id, variantId: setVariant.id, quantity: 2 }],
    idempotencyKey: `set-${Math.random().toString(36).slice(2, 10)}`,
    paymentMethod: "manual_transfer",
    paymentProvider: "TBD"
  });

  return { component, order: sale.order };
}

describe("packOrder", () => {
  it("creates a parcel and moves the order to PACKED", async () => {
    const context = createTestContext();
    const { order } = await seedPaidOrder(context);

    const parcel = await packOrder(context, packer, { orderId: order.id });

    expect(parcel.status).toBe("PACKED");
    expect(parcel.packedByName).toBe("Ama");
    expect(parcel.parcelNumber).toBe(`${order.orderNumber}-P1`);
    expect((await context.repo.getOrder(order.id))?.fulfilmentStatus).toBe("PACKED");
  });

  it("refuses to pack the same order twice — the whole point", async () => {
    const context = createTestContext();
    const { order } = await seedPaidOrder(context);
    await packOrder(context, packer, { orderId: order.id });

    await expect(packOrder(context, packer, { orderId: order.id })).rejects.toBeInstanceOf(CommerceError);
    expect(await context.repo.findParcelsByOrderId(order.id)).toHaveLength(1);
  });

  it("names who packed it first, so the second person knows who to ask", async () => {
    const context = createTestContext();
    const { order } = await seedPaidOrder(context);
    await packOrder(context, packer, { orderId: order.id });

    await expect(packOrder(context, packer, { orderId: order.id })).rejects.toThrow(/Ama/);
  });

  it("explodes a set into its components so the picker sees real items", async () => {
    const context = createTestContext();
    const { order } = await seedPaidSetOrder(context);

    const parcel = await packOrder(context, packer, { orderId: order.id });

    // 2 sets x 3 washes each.
    expect(parcel.items).toHaveLength(1);
    expect(parcel.items[0].sku).toBe("OMK-WASH-100");
    expect(parcel.items[0].quantity).toBe(6);
    expect(parcel.items[0].viaSetTitle).toBe("Chronic Infection Set");
  });

  it("refuses an order that predates parcels but is already sent", async () => {
    const context = createTestContext();
    const { order } = await seedPaidOrder(context);
    // No parcel record, but plainly already gone — packing it would duplicate.
    await context.repo.saveOrder({ ...order, fulfilmentStatus: "FULFILLED" });

    await expect(packOrder(context, packer, { orderId: order.id })).rejects.toBeInstanceOf(CommerceError);
  });

  it("refuses to pack an unpaid order", async () => {
    const context = createTestContext();
    const { order } = await seedPaidOrder(context);
    await context.repo.saveOrder({ ...order, paymentStatus: "PENDING" });

    await expect(packOrder(context, packer, { orderId: order.id })).rejects.toBeInstanceOf(CommerceError);
  });

  it("allows a reship after a return, but demands a reason", async () => {
    const context = createTestContext();
    const { order } = await seedPaidOrder(context);
    const first = await packOrder(context, packer, { orderId: order.id });
    await dispatchParcels(context, packer, { parcelIds: [first.id] });
    await returnParcel(context, owner, { parcelId: first.id, reason: "Customer unreachable" });

    await expect(packOrder(context, packer, { orderId: order.id })).rejects.toBeInstanceOf(CommerceError);

    const second = await packOrder(context, packer, { orderId: order.id, reshipReason: "Customer called back" });
    expect(second.parcelNumber).toBe(`${order.orderNumber}-P2`);
    expect(second.reshipOfParcelId).toBe(first.id);
  });
});

describe("returnParcel", () => {
  it("is refused to packing staff — returning is what would free a re-pack", async () => {
    const context = createTestContext();
    const { order } = await seedPaidOrder(context);
    const parcel = await packOrder(context, packer, { orderId: order.id });

    await expect(
      returnParcel(context, packer, { parcelId: parcel.id, reason: "faking it" })
    ).rejects.toBeInstanceOf(CommerceError);
    expect((await context.repo.getParcel(parcel.id))?.status).toBe("PACKED");
  });

  it("puts stock back when a manager records the return", async () => {
    const context = createTestContext();
    const { variant, order } = await seedPaidOrder(context);
    const before = (await context.repo.getVariant(variant.productId, variant.id))?.stockAvailable ?? 0;

    const parcel = await packOrder(context, packer, { orderId: order.id });
    await returnParcel(context, owner, { parcelId: parcel.id, reason: "Refused at the door" });

    const after = (await context.repo.getVariant(variant.productId, variant.id))?.stockAvailable ?? 0;
    expect(after).toBe(before + 2);
    expect((await context.repo.getOrder(order.id))?.fulfilmentStatus).toBe("RETURNED");
  });

  it("restores a set's components, not the set itself", async () => {
    const context = createTestContext();
    const { component, order } = await seedPaidSetOrder(context);
    const before = (await context.repo.getVariant(component.productId, component.id))?.stockAvailable ?? 0;

    const parcel = await packOrder(context, packer, { orderId: order.id });
    await returnParcel(context, owner, { parcelId: parcel.id, reason: "Returned" });

    const after = (await context.repo.getVariant(component.productId, component.id))?.stockAvailable ?? 0;
    expect(after).toBe(before + 6);
  });
});

describe("dispatch and delivery", () => {
  it("dispatches a batch and moves each order out for delivery", async () => {
    const context = createTestContext();
    const first = await seedPaidOrder(context);
    const second = await seedPaidOrder(context);
    const parcelA = await packOrder(context, packer, { orderId: first.order.id });
    const parcelB = await packOrder(context, packer, { orderId: second.order.id });

    const dispatched = await dispatchParcels(context, packer, {
      parcelIds: [parcelA.id, parcelB.id],
      courier: "Kwame"
    });

    expect(dispatched).toHaveLength(2);
    expect(dispatched[0].courier).toBe("Kwame");
    expect((await context.repo.getOrder(first.order.id))?.fulfilmentStatus).toBe("OUT_FOR_DELIVERY");
  });

  it("closes the order out when the parcel is delivered", async () => {
    const context = createTestContext();
    const { order } = await seedPaidOrder(context);
    const parcel = await packOrder(context, packer, { orderId: order.id });
    await dispatchParcels(context, packer, { parcelIds: [parcel.id] });

    await markParcelDelivered(context, packer, parcel.id);

    expect((await context.repo.getOrder(order.id))?.fulfilmentStatus).toBe("FULFILLED");
  });
});

describe("holdOrderPacking", () => {
  it("records why it couldn't be packed so nobody retries blindly", async () => {
    const context = createTestContext();
    const { order } = await seedPaidOrder(context);

    await holdOrderPacking(context, packer, { orderId: order.id, reason: "Out of 100ml bottles" });

    expect((await context.repo.getOrder(order.id))?.packHold?.reason).toBe("Out of 100ml bottles");
  });

  it("clears the hold once it is actually packed", async () => {
    const context = createTestContext();
    const { order } = await seedPaidOrder(context);
    await holdOrderPacking(context, packer, { orderId: order.id, reason: "Out of bottles" });

    await packOrder(context, packer, { orderId: order.id });

    expect((await context.repo.getOrder(order.id))?.packHold).toBeNull();
  });
});

describe("updateOrderFulfilment forward-only guard", () => {
  it("allows moving forward", async () => {
    const context = createTestContext();
    const { order } = await seedPaidOrder(context);

    const updated = await updateOrderFulfilment(context, owner, {
      id: order.id,
      fulfilmentStatus: "OUT_FOR_DELIVERY"
    });
    expect(updated.fulfilmentStatus).toBe("OUT_FOR_DELIVERY");
  });

  it("refuses to move backwards without a reason", async () => {
    const context = createTestContext();
    const { order } = await seedPaidOrder(context);
    await updateOrderFulfilment(context, owner, { id: order.id, fulfilmentStatus: "FULFILLED" });

    await expect(
      updateOrderFulfilment(context, owner, { id: order.id, fulfilmentStatus: "PROCESSING" })
    ).rejects.toBeInstanceOf(CommerceError);
  });

  it("allows a reversal with a reason from someone holding the override", async () => {
    const context = createTestContext();
    const { order } = await seedPaidOrder(context);
    await updateOrderFulfilment(context, owner, { id: order.id, fulfilmentStatus: "FULFILLED" });

    const reversed = await updateOrderFulfilment(context, owner, {
      id: order.id,
      fulfilmentStatus: "PROCESSING",
      reason: "Marked delivered by mistake"
    });
    expect(reversed.fulfilmentStatus).toBe("PROCESSING");
  });

  it("still allows cancelling from anywhere", async () => {
    const context = createTestContext();
    const { order } = await seedPaidOrder(context);
    await updateOrderFulfilment(context, owner, { id: order.id, fulfilmentStatus: "OUT_FOR_DELIVERY" });

    const cancelled = await updateOrderFulfilment(context, owner, {
      id: order.id,
      fulfilmentStatus: "CANCELLED"
    });
    expect(cancelled.fulfilmentStatus).toBe("CANCELLED");
  });
});
