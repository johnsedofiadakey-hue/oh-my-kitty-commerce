"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { CommerceError } from "@/lib/commerce/errors";
import { adjustInventory } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { formInteger, formString, type AdminActionState } from "@/lib/admin/product-form";

type AdjustableMovementType = "STOCK_RECEIVED" | "DAMAGE" | "LOSS" | "MANUAL_ADJUSTMENT";

const adjustableMovementTypes: AdjustableMovementType[] = [
  "STOCK_RECEIVED",
  "DAMAGE",
  "LOSS",
  "MANUAL_ADJUSTMENT"
];

// Returns a message for the form to show instead of throwing: a thrown error
// replaces the whole page with a generic "Something went wrong" screen, which
// is a harsh response to an ordinary mistake like removing more than is there.
export async function adjustInventoryAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const productId = formString(formData, "productId");
  const variantId = formString(formData, "variantId");

  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const result = await adjustInventory(context, actor, {
      productId,
      variantId,
      type: formMovementType(formData),
      quantityDelta: formInteger(formData, "quantityDelta", 0),
      reason: formString(formData, "reason"),
      requestId: formString(formData, "requestId") || undefined
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    revalidatePath("/shop");

    return {
      status: "success",
      message: `Saved. ${result.variant.sku} now has ${result.variant.stockAvailable} in stock.`,
      productId,
      variantId
    };
  } catch (error) {
    return { status: "error", message: await friendlyMessage(error, productId, variantId) };
  }
}

async function friendlyMessage(error: unknown, productId: string, variantId: string) {
  if (error instanceof CommerceError && error.code === "OUT_OF_STOCK") {
    const current = await currentStock(productId, variantId);
    return current === null
      ? "That would take the stock below zero. Enter a smaller number."
      : `Not saved. Only ${current} in stock, so you can't remove more than ${current}.`;
  }

  if (error instanceof ZodError) {
    return "Not saved. Enter a whole number that isn't 0, and a reason of at least 3 characters.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Not saved. Please try again.";
}

async function currentStock(productId: string, variantId: string) {
  try {
    const variant = await requireCommerceContext().repo.getVariant(productId, variantId);
    return variant ? variant.stockAvailable : null;
  } catch {
    return null;
  }
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
