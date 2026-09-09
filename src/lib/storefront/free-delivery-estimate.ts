/**
 * Free Delivery runs on a fixed weekly cycle, not a countdown from the
 * moment of order: a rider collects every Tuesday (same-day if the order
 * was placed that Tuesday, otherwise the following one) and delivers by
 * that week's Saturday at the latest. This is deliberately zero-dependency
 * — safe to import from both server code and client components (the
 * checkout page needs it before an order even exists) without pulling in
 * anything else from this directory.
 */

export const FREE_DELIVERY_RULE_ID = "delivery-free";

export type FreeDeliveryEstimate = {
  collectionDate: Date;
  arrivalDate: Date;
};

const TUESDAY = 2;
const COLLECTION_TO_ARRIVAL_DAYS = 4;

export function computeFreeDeliveryEstimate(fromDate: Date): FreeDeliveryEstimate {
  const daysUntilTuesday = (TUESDAY - fromDate.getDay() + 7) % 7;
  const collectionDate = addDays(fromDate, daysUntilTuesday);
  const arrivalDate = addDays(collectionDate, COLLECTION_TO_ARRIVAL_DAYS);
  return { collectionDate, arrivalDate };
}

export function formatFreeDeliveryEstimate(fromDate: Date): string {
  const { collectionDate, arrivalDate } = computeFreeDeliveryEstimate(fromDate);
  const formatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
  return `Collected ${formatter.format(collectionDate)} — arrives by ${formatter.format(arrivalDate)}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
