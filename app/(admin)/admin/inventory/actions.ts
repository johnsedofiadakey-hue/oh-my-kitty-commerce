"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { CommerceError } from "@/lib/commerce/errors";
import { adjustInventory, setInventoryCount } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { formString, type AdminActionState } from "@/lib/admin/product-form";

type RemoveType = "DAMAGE" | "LOSS" | "MANUAL_ADJUSTMENT";

const removeReasons: Record<RemoveType, string> = {
  DAMAGE: "Damaged",
  LOSS: "Lost",
  MANUAL_ADJUSTMENT: "Stock removed"
};

// One form, three plain choices: add stock, remove stock, or "I counted N on
// the shelf". Returns a message for the form to show instead of throwing — a
// thrown error replaces the whole page with a generic "Something went wrong".
export async function adjustInventoryAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const productId = formString(formData, "productId");
  const variantId = formString(formData, "variantId");

  try {
    const mode = formString(formData, "mode");
    const amountText = formString(formData, "amount");
    if (!/^\d+$/.test(amountText)) {
      return { status: "error", message: "Enter a whole number, 0 or more." };
    }
    const amount = Number(amountText);
    const note = formString(formData, "note");
    const requestId = formString(formData, "requestId") || undefined;

    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    const where = { productId, variantId };

    let message: string;
    if (mode === "set") {
      const result = await setInventoryCount(context, actor, {
        ...where,
        count: amount,
        reason: note || "Stock count",
        requestId
      });
      message = result.movement
        ? `Saved. ${result.variant.sku} now has ${result.variant.stockAvailable} in stock.`
        : `Nothing to change. ${result.variant.sku} already has ${result.variant.stockAvailable} in stock.`;
    } else if (mode === "add" || mode === "remove") {
      if (amount === 0) {
        return { status: "error", message: "Enter how many, more than 0." };
      }
      const adding = mode === "add";
      const removeType = removeTypeFrom(formString(formData, "removeType"));
      const result = await adjustInventory(context, actor, {
        ...where,
        type: adding ? "STOCK_RECEIVED" : removeType,
        quantityDelta: adding ? amount : -amount,
        reason: note || (adding ? "Restock" : removeReasons[removeType]),
        requestId
      });
      message = `Saved. ${result.variant.sku} now has ${result.variant.stockAvailable} in stock.`;
    } else {
      return { status: "error", message: "Choose whether you are adding, removing or counting stock." };
    }

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    revalidatePath("/shop");

    return { status: "success", message, productId, variantId };
  } catch (error) {
    return { status: "error", message: await friendlyMessage(error, productId, variantId) };
  }
}

function removeTypeFrom(value: string): RemoveType {
  return value === "DAMAGE" || value === "LOSS" ? value : "MANUAL_ADJUSTMENT";
}

async function friendlyMessage(error: unknown, productId: string, variantId: string) {
  if (error instanceof CommerceError && error.code === "OUT_OF_STOCK") {
    const current = await currentStock(productId, variantId);
    if (current === null) {
      return "Not saved. That is more than you have in stock.";
    }
    return `Not saved. You only have ${current} in stock, so you can't remove more than that.`;
  }

  if (error instanceof ZodError) {
    return "Not saved. Check the number and try again.";
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

function requireCommerceContext() {
  const context = getCommerceServerContext();
  if (!context) {
    throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
  }

  return context;
}
