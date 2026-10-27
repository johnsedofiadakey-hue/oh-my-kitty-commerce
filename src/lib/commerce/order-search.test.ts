import { describe, expect, it } from "vitest";
import { groupPaymentsByOrderId, orderMatchesQuery } from "@/lib/commerce/order-search";
import type { Order, Payment } from "@/lib/commerce/types";

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    orderNumber: "OMK-ABCD1234",
    channel: "ADMIN_CREATED",
    status: "PAID",
    paymentStatus: "PAID",
    fulfilmentStatus: "UNFULFILLED",
    customerSnapshot: { name: "Akosua Mensah", phone: "0552223344" },
    items: [],
    subtotal: 15000,
    discountTotal: 0,
    deliveryTotal: 3000,
    taxTotal: 0,
    paymentFeeTotal: 0,
    total: 18000,
    currency: "GHS",
    idempotencyKey: "outside-00000001",
    ...overrides
  } as Order;
}

function buildPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "payment-1",
    orderId: "order-1",
    provider: "MANUAL",
    method: "mobile_money",
    status: "PAID",
    amount: 18000,
    currency: "GHS",
    providerReference: "MP251027.1455.B77231",
    payerNumber: "233241448231",
    receivedInto: "Personal MoMo | 0241448231",
    idempotencyKey: "outside-00000001",
    ...overrides
  } as Payment;
}

describe("looking an order up", () => {
  const order = buildOrder();
  const payments = [buildPayment()];

  it("matches the MoMo transaction id from a screenshot", () => {
    expect(orderMatchesQuery(order, payments, "MP251027.1455.B77231")).toBe(true);
    // Case and surrounding whitespace are how a pasted reference actually arrives.
    expect(orderMatchesQuery(order, payments, "  mp251027.1455.b77231  ")).toBe(true);
  });

  it("matches a partial reference, since staff read these off a phone screen", () => {
    expect(orderMatchesQuery(order, payments, "B77231")).toBe(true);
  });

  it("matches the paying number however it is typed", () => {
    for (const typed of ["0241448231", "+233241448231", "233241448231", "024 144 8231"]) {
      expect(orderMatchesQuery(order, payments, typed), `searching ${typed}`).toBe(true);
    }
  });

  it("matches the customer's own phone in a different format to the stored one", () => {
    expect(orderMatchesQuery(order, payments, "+233552223344")).toBe(true);
  });

  it("still matches order number and name", () => {
    expect(orderMatchesQuery(order, payments, "OMK-ABCD1234")).toBe(true);
    expect(orderMatchesQuery(order, payments, "akosua")).toBe(true);
  });

  it("does not match an unrelated reference or number", () => {
    expect(orderMatchesQuery(order, payments, "MP000000.0000.ZZZZZZ")).toBe(false);
    expect(orderMatchesQuery(order, payments, "0209999999")).toBe(false);
  });

  it("treats an empty query as 'no filter' so the full list still renders", () => {
    expect(orderMatchesQuery(order, payments, "")).toBe(true);
    expect(orderMatchesQuery(order, payments, "   ")).toBe(true);
  });

  it("works for an order with no payment row at all", () => {
    expect(orderMatchesQuery(order, [], "OMK-ABCD1234")).toBe(true);
    expect(orderMatchesQuery(order, [], "MP251027.1455.B77231")).toBe(false);
  });

  it("does not let a blank stored field match a blank-ish query", () => {
    const sparse = buildOrder({ customerSnapshot: { name: undefined, phone: null } });
    expect(orderMatchesQuery(sparse, [buildPayment({ payerNumber: null, receivedInto: null })], "0241448231")).toBe(
      false
    );
  });
});

describe("grouping payments for a search", () => {
  it("keeps every payment for an order, not just the first", () => {
    const grouped = groupPaymentsByOrderId([
      buildPayment({ id: "p1", providerReference: "FIRST" }),
      buildPayment({ id: "p2", providerReference: "SECOND" }),
      buildPayment({ id: "p3", orderId: "order-2", providerReference: "OTHER" })
    ]);

    expect(grouped.get("order-1")?.map((p) => p.providerReference)).toEqual(["FIRST", "SECOND"]);
    expect(grouped.get("order-2")).toHaveLength(1);
    expect(grouped.get("missing")).toBeUndefined();
  });

  it("finds an order by a second payment's reference", () => {
    const order = buildOrder();
    const payments = [buildPayment({ providerReference: "FIRST" }), buildPayment({ providerReference: "SECOND" })];
    expect(orderMatchesQuery(order, payments, "SECOND")).toBe(true);
  });
});
