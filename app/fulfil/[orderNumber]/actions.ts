"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import { trackOrder, updateOrderFulfilment } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { verifyOrderFulfilToken } from "@/lib/admin/quick-action-token";
import { formString } from "@/lib/admin/product-form";
import type { FulfilmentStatus } from "@/lib/commerce/types";

const fulfilmentStatuses: FulfilmentStatus[] = [
  "PROCESSING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "FULFILLED",
  "CANCELLED"
];

export async function quickFulfilAction(formData: FormData): Promise<void> {
  const orderNumber = formString(formData, "orderNumber");
  const token = formString(formData, "token");
  const status = formFulfilmentStatus(formData);

  if (!verifyOrderFulfilToken(orderNumber, token)) {
    throw new CommerceError("FORBIDDEN", "This link is no longer valid.");
  }

  const context = getCommerceServerContext();
  if (!context) {
    throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
  }

  const order = await trackOrder(context, orderNumber);
  if (!order) {
    throw new CommerceError("NOT_FOUND", `Order not found: ${orderNumber}`);
  }

  // The token itself is the authorization here — this route is deliberately
  // reachable without a login, so the actor is a narrow system identity,
  // same pattern as the Paystack webhook and POS offline sync.
  await updateOrderFulfilment(
    context,
    { uid: "system:quick-fulfil", roleIds: [], system: true },
    { id: order.id, fulfilmentStatus: status }
  );

  revalidatePath(`/fulfil/${orderNumber}`);
  revalidatePath("/admin/orders");
}

function formFulfilmentStatus(formData: FormData): FulfilmentStatus {
  const value = formString(formData, "fulfilmentStatus");
  const match = fulfilmentStatuses.find((status) => status === value);
  if (!match) {
    throw new CommerceError("VALIDATION_ERROR", "Choose a valid status.");
  }

  return match;
}
