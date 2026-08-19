"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import { adjustInventory } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { formInteger, formString } from "@/lib/admin/product-form";

type AdjustableMovementType = "STOCK_RECEIVED" | "DAMAGE" | "LOSS" | "MANUAL_ADJUSTMENT";

const adjustableMovementTypes: AdjustableMovementType[] = [
  "STOCK_RECEIVED",
  "DAMAGE",
  "LOSS",
  "MANUAL_ADJUSTMENT"
];

export async function adjustInventoryAction(formData: FormData): Promise<void> {
  const context = requireCommerceContext();
  const actor = await getRequiredAdminActor();

  await adjustInventory(context, actor, {
    productId: formString(formData, "productId"),
    variantId: formString(formData, "variantId"),
    type: formMovementType(formData),
    quantityDelta: formInteger(formData, "quantityDelta", 0),
    reason: formString(formData, "reason")
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

function formMovementType(formData: FormData): AdjustableMovementType {
  const value = formString(formData, "type");
  const match = adjustableMovementTypes.find((type) => type === value);
  if (!match) {
    throw new CommerceError("VALIDATION_ERROR", "Choose a valid movement type.");
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
