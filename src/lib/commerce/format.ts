export function formatMoney(amount: number) {
  return `GHS ${(amount / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

// Staff-facing labels for admin/POS/quick-fulfil surfaces. Deliberately
// distinct from the customer-facing copy in track-order-client.tsx — staff
// need precise operational language, customers need reassuring plain
// English, and conflating the two made past copy changes risk breaking one
// audience while fixing the other.
export const FULFILMENT_STATUS_LABELS: Record<string, string> = {
  UNFULFILLED: "New order",
  PROCESSING: "Processing",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  FULFILLED: "Delivered / Collected",
  CANCELLED: "Cancelled"
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Awaiting payment",
  AUTHORIZED: "Payment authorized",
  PAID: "Payment confirmed",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded"
};

export function formatFulfilmentStatus(status: string) {
  return FULFILMENT_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function formatPaymentStatus(status: string) {
  return PAYMENT_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}
