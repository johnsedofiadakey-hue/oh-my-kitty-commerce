import { describe, expect, it } from "vitest";
import {
  describeDeliveryFee,
  describeDeliveryTerms,
  eligibleSpendFor,
  freeDeliveryThreshold,
  qualifiesForFreeDelivery,
  resolveDeliveryFee,
  spendToFreeDelivery
} from "@/lib/commerce/delivery-pricing";

const paidCourier = { fee: 0, freeAbove: null, feePaidOnDelivery: true };
const flatFee = { fee: 3000, freeAbove: null };
const withThreshold = { fee: 3000, freeAbove: 30000 };

describe("delivery fee", () => {
  it("charges the flat fee when the rule has no threshold", () => {
    expect(resolveDeliveryFee(flatFee, 100000)).toBe(3000);
    expect(describeDeliveryFee(flatFee, 100000)).toBe("GHS 30.00");
  });

  it("waives the fee once the order reaches the threshold", () => {
    expect(resolveDeliveryFee(withThreshold, 29999)).toBe(3000);
    expect(resolveDeliveryFee(withThreshold, 30000)).toBe(0);
    expect(resolveDeliveryFee(withThreshold, 45000)).toBe(0);
  });

  it("treats the threshold as inclusive, so spending it exactly qualifies", () => {
    expect(qualifiesForFreeDelivery(withThreshold, 30000)).toBe(true);
    expect(qualifiesForFreeDelivery(withThreshold, 29999)).toBe(false);
  });

  it("measures the threshold on items after discount, not before", () => {
    // A GHS 320 basket with a GHS 50 promo has really spent GHS 270.
    const spend = eligibleSpendFor(32000, 5000);
    expect(spend).toBe(27000);
    expect(resolveDeliveryFee(withThreshold, spend)).toBe(3000);
  });

  it("never bills a fee the courier collects, and never calls it free", () => {
    expect(resolveDeliveryFee(paidCourier, 0)).toBe(0);
    expect(resolveDeliveryFee(paidCourier, 500000)).toBe(0);
    expect(describeDeliveryFee(paidCourier, 0)).toBe("Paid to courier");
  });

  it("does not bill a courier-collected fee even if a fee was left on the rule", () => {
    // Guards against an admin ticking the box without clearing the amount:
    // the customer would otherwise pay once online and again at the door.
    const contradictory = { fee: 3000, freeAbove: null, feePaidOnDelivery: true };
    expect(resolveDeliveryFee(contradictory, 1000)).toBe(0);
    expect(describeDeliveryFee(contradictory, 1000)).toBe("Paid to courier");
  });

  it("says Free only when delivery really costs the customer nothing", () => {
    expect(describeDeliveryFee({ fee: 0 }, 0)).toBe("Free");
    expect(describeDeliveryFee(withThreshold, 30000)).toBe("Free");
  });
});

describe("free delivery threshold", () => {
  it("ignores a threshold on an option that is already free", () => {
    // Otherwise the cart's "add X more for free delivery" bar would chase a
    // reward the customer already has.
    expect(freeDeliveryThreshold({ fee: 0, freeAbove: 30000 })).toBeNull();
  });

  it("ignores a threshold on a courier-collected fee, which the shop cannot waive", () => {
    expect(freeDeliveryThreshold({ fee: 3000, freeAbove: 30000, feePaidOnDelivery: true })).toBeNull();
  });

  it("treats a zero or missing threshold as no threshold", () => {
    expect(freeDeliveryThreshold({ fee: 3000, freeAbove: 0 })).toBeNull();
    expect(freeDeliveryThreshold({ fee: 3000, freeAbove: null })).toBeNull();
    expect(freeDeliveryThreshold({ fee: 3000 })).toBeNull();
  });

  it("reports what is left to spend, and nothing once it is reached", () => {
    expect(spendToFreeDelivery(withThreshold, 22000)).toBe(8000);
    expect(spendToFreeDelivery(withThreshold, 30000)).toBeNull();
    expect(spendToFreeDelivery(flatFee, 0)).toBeNull();
  });
});

describe("standing terms, with no cart to measure", () => {
  it("states the fee and the threshold together", () => {
    expect(describeDeliveryTerms(withThreshold)).toBe("GHS 30.00 · free over GHS 300.00");
  });

  it("states a flat fee on its own", () => {
    expect(describeDeliveryTerms(flatFee)).toBe("GHS 30.00");
  });

  it("distinguishes genuinely free from paid-to-courier", () => {
    expect(describeDeliveryTerms({ fee: 0 })).toBe("Free");
    expect(describeDeliveryTerms(paidCourier)).toBe("Paid to courier");
  });
});
