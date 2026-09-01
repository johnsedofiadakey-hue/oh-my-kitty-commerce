"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import { deleteOrder, updateOrderFulfilment } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { formString, type AdminActionState } from "@/lib/admin/product-form";
import type { FulfilmentStatus } from "@/lib/commerce/types";

const fulfilmentStatuses: FulfilmentStatus[] = [
  "UNFULFILLED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "FULFILLED",
  "CANCELLED"
];

export async function updateOrderFulfilmentAction(formData: FormData): Promise<void> {
  const context = requireCommerceContext();
  const actor = await getRequiredAdminActor();

  await updateOrderFulfilment(context, actor, {
    id: formString(formData, "id"),
    fulfilmentStatus: formFulfilmentStatus(formData)
  });

  revalidatePath("/admin/orders");
}

export async function deleteOrderAction(orderId: string): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await deleteOrder(context, actor, orderId);

    revalidatePath("/admin/orders");
    return { status: "success", message: "Order deleted." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof CommerceError ? error.message : "Delete failed."
    };
  }
}

function formFulfilmentStatus(formData: FormData): FulfilmentStatus {
  const value = formString(formData, "fulfilmentStatus");
  const match = fulfilmentStatuses.find((status) => status === value);
  if (!match) {
    throw new CommerceError("VALIDATION_ERROR", "Choose a valid fulfilment status.");
  }

  return match;
}

function requireCommerceContext() {
  const context = getCommerceServerContext();
  if (!context) {
    throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
  }

  return context;
}
