// Paystack's flat Ghana rate for cards, mobile money, and bank transfer — no
// fixed fee, no cap (confirmed against Paystack's published Ghana pricing).
// Passed on to the customer as a disclosed line item rather than absorbed,
// so the business nets ~the full order value instead of losing ~2% per sale.
// Kept dependency-free (no node:crypto, unlike paystack.ts) so client
// components can import it to show an estimated fee before checkout.
export const PAYSTACK_FEE_RATE = 0.0195;

export function calculatePaystackFee(amountMinorUnit: number) {
  return Math.round(amountMinorUnit * PAYSTACK_FEE_RATE);
}
