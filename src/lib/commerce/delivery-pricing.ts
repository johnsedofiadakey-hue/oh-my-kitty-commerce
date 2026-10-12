import { formatMoney } from "@/lib/commerce/format";

/**
 * The parts of a delivery rule that decide what the customer actually pays.
 * Kept as a loose shape rather than taking a whole `DeliveryRule` so the
 * checkout page can pass its trimmed-down storefront option straight in.
 */
export type DeliveryFeeTerms = {
  fee: number;
  /**
   * Spend this much (after discounts) and delivery is on us. `null`, absent,
   * or 0 all mean "no threshold" — the fee always applies.
   */
  freeAbove?: number | null;
  /**
   * The courier collects the fee at the door, so the shop never bills it.
   * Checkout must not charge it, and must not call it "Free" either — a
   * customer who reads "Free" and then gets asked for money at the door
   * refuses the parcel.
   */
  feePaidOnDelivery?: boolean;
};

/**
 * The spend that counts toward a free-delivery threshold: merchandise after
 * discounts, before delivery, tax, and the Paystack surcharge. A promo code
 * therefore pushes the customer *away* from free delivery, which is the
 * normal retail behaviour — the threshold rewards what was actually spent.
 */
export function eligibleSpendFor(subtotal: number, discountTotal: number): number {
  return Math.max(0, subtotal - discountTotal);
}

/** The rule's threshold, or null when it has none worth showing. */
export function freeDeliveryThreshold(terms: DeliveryFeeTerms): number | null {
  if (terms.feePaidOnDelivery) {
    // The shop isn't the one charging, so there is nothing to waive.
    return null;
  }

  if (terms.fee <= 0) {
    // Already free for everyone; a threshold on top of that is meaningless
    // and would otherwise drive a "spend more to unlock" bar that never ends.
    return null;
  }

  return typeof terms.freeAbove === "number" && terms.freeAbove > 0 ? terms.freeAbove : null;
}

/** Whether this cart has reached the threshold. "Above" is inclusive: spend exactly it and you qualify. */
export function qualifiesForFreeDelivery(terms: DeliveryFeeTerms, eligibleSpend: number): boolean {
  const threshold = freeDeliveryThreshold(terms);
  return threshold !== null && eligibleSpend >= threshold;
}

/** What still has to go in the basket to unlock it, or null when there's nothing to unlock. */
export function spendToFreeDelivery(terms: DeliveryFeeTerms, eligibleSpend: number): number | null {
  const threshold = freeDeliveryThreshold(terms);
  if (threshold === null || eligibleSpend >= threshold) {
    return null;
  }

  return threshold - eligibleSpend;
}

/**
 * The single answer to "what do we bill for delivery?". Checkout's summary,
 * the Paystack route, and buildOrder all go through this, so the figure the
 * customer is shown is by construction the figure they are charged.
 */
export function resolveDeliveryFee(terms: DeliveryFeeTerms, eligibleSpend: number): number {
  if (terms.feePaidOnDelivery) {
    return 0;
  }

  if (qualifiesForFreeDelivery(terms, eligibleSpend)) {
    return 0;
  }

  return Math.max(0, terms.fee);
}

/** How the fee reads on screen. Never says "Free" about money the courier will ask for. */
export function describeDeliveryFee(terms: DeliveryFeeTerms, eligibleSpend: number): string {
  if (terms.feePaidOnDelivery) {
    return "Paid to courier";
  }

  const fee = resolveDeliveryFee(terms, eligibleSpend);
  return fee > 0 ? formatMoney(fee) : "Free";
}

/**
 * How a rule reads with no cart to measure against — the Delivery page lists
 * the options before anyone has chosen anything, so it states the standing
 * terms ("GHS 30.00 · free over GHS 300.00") rather than a price that would
 * be wrong for most baskets.
 */
export function describeDeliveryTerms(terms: DeliveryFeeTerms): string {
  if (terms.feePaidOnDelivery) {
    return "Paid to courier";
  }

  if (terms.fee <= 0) {
    return "Free";
  }

  const threshold = freeDeliveryThreshold(terms);
  return threshold === null
    ? formatMoney(terms.fee)
    : `${formatMoney(terms.fee)} · free over ${formatMoney(threshold)}`;
}
