import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env/server";

/**
 * Signs a narrow, single-purpose capability: "whoever holds this token may
 * update fulfilment status on this one order." No expiry, no Firestore
 * storage — the token is just an HMAC of the order number, so it's cheap to
 * verify and impossible to guess without ADMIN_QUICK_ACTION_SECRET. This
 * is the same trust model as the customer order-tracking link (an
 * unguessable value delivered only over a private channel — here, the
 * admin's own SMS alert), not a session or login replacement. It can only
 * ever touch fulfilmentStatus on the one order it was signed for.
 */
export function signOrderFulfilToken(orderNumber: string): string | null {
  const secret = serverEnv.ADMIN_QUICK_ACTION_SECRET;
  if (!secret) {
    return null;
  }

  return createHmac("sha256", secret).update(orderNumber).digest("hex");
}

export function verifyOrderFulfilToken(orderNumber: string, token: string | undefined): boolean {
  const secret = serverEnv.ADMIN_QUICK_ACTION_SECRET;
  if (!secret || !token) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(orderNumber).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(token, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}
