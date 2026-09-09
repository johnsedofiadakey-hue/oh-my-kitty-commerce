import { describe, expect, it } from "vitest";
import { computeFreeDeliveryEstimate } from "@/lib/storefront/free-delivery-estimate";

function dateOnly(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

describe("computeFreeDeliveryEstimate", () => {
  it("collects same-day when ordered on a Tuesday", () => {
    const { collectionDate, arrivalDate } = computeFreeDeliveryEstimate(dateOnly("2026-09-08")); // Tuesday
    expect(collectionDate.toDateString()).toBe(dateOnly("2026-09-08").toDateString());
    expect(arrivalDate.toDateString()).toBe(dateOnly("2026-09-12").toDateString()); // Saturday
  });

  it("rolls forward to the next Tuesday when ordered mid-week", () => {
    const { collectionDate, arrivalDate } = computeFreeDeliveryEstimate(dateOnly("2026-09-09")); // Wednesday
    expect(collectionDate.toDateString()).toBe(dateOnly("2026-09-15").toDateString()); // next Tuesday
    expect(arrivalDate.toDateString()).toBe(dateOnly("2026-09-19").toDateString()); // that Saturday
  });

  it("rolls forward by one day when ordered the day before (Monday)", () => {
    const { collectionDate } = computeFreeDeliveryEstimate(dateOnly("2026-09-07")); // Monday
    expect(collectionDate.toDateString()).toBe(dateOnly("2026-09-08").toDateString());
  });

  it("rolls forward a full week when ordered right after Tuesday's cutoff", () => {
    const { collectionDate } = computeFreeDeliveryEstimate(dateOnly("2026-09-13")); // Sunday
    expect(collectionDate.toDateString()).toBe(dateOnly("2026-09-15").toDateString());
  });
});
