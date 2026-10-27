import { normalizeGhanaPhone } from "@/lib/commerce/phone";
import type { Order, Payment } from "@/lib/commerce/types";

/**
 * What counts as a match when looking an order up.
 *
 * Shared by the POS receipt lookup (`searchOrders`) and the admin orders
 * screen, because those are the two places a dispute gets settled and they
 * must not disagree about whether a given reference finds a given order.
 *
 * Searchable: the order number, the customer's name and phone, and everything
 * written on the payment — the MoMo transaction id, the number that paid, and
 * the wallet it landed in. The payment side is the point: a customer turning
 * up with an old screenshot is answered by pasting its transaction id.
 */
export function orderMatchesQuery(order: Order, payments: Payment[], rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return true;
  }

  const fields = searchableFields(order, payments);
  if (fields.join(" ").toLowerCase().includes(query)) {
    return true;
  }

  // 0241448231, +233241448231 and 024 144 8231 are one number. Falling back to
  // a normalised comparison means the number is found however it was typed —
  // by the customer when they ordered, or by whoever is searching now.
  const asPhone = normalizeGhanaPhone(query);
  if (!asPhone) {
    return false;
  }

  return fields.some((value) => {
    const candidate = normalizeGhanaPhone(value);
    return candidate !== "" && candidate === asPhone;
  });
}

function searchableFields(order: Order, payments: Payment[]): string[] {
  return [
    order.orderNumber,
    order.customerSnapshot?.name,
    order.customerSnapshot?.phone,
    ...payments.flatMap((payment) => [payment.providerReference, payment.payerNumber, payment.receivedInto])
  ].filter((value): value is string => Boolean(value));
}

/** Payments grouped by order id, so a search reads the payments collection once. */
export function groupPaymentsByOrderId(payments: Payment[]): Map<string, Payment[]> {
  const byOrderId = new Map<string, Payment[]>();
  for (const payment of payments) {
    const existing = byOrderId.get(payment.orderId);
    if (existing) {
      existing.push(payment);
    } else {
      byOrderId.set(payment.orderId, [payment]);
    }
  }

  return byOrderId;
}
