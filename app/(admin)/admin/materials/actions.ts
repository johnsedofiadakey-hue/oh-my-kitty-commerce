"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import {
  createMaterialPurchase,
  createRawMaterial,
  deleteRawMaterial,
  recordProductionRun,
  updateRawMaterial,
  updateVariant
} from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import {
  formDate,
  formMoneyMinorUnit,
  formNumber,
  formOptionalString,
  formString,
  type AdminActionState
} from "@/lib/admin/product-form";
import { formatMoney } from "@/lib/commerce/format";

export async function createRawMaterialAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const material = await createRawMaterial(context, actor, {
      name: formString(formData, "name"),
      unit: formString(formData, "unit"),
      kind: formMaterialKind(formData),
      costPerUnit: formMoneyMinorUnit(formData, "costPerUnit"),
      stockOnHand: formNumber(formData, "stockOnHand", 0),
      lowStockThreshold: formNumber(formData, "lowStockThreshold", 0),
      supplier: formOptionalString(formData, "supplier")
    });

    revalidatePath("/admin/materials");
    revalidatePath("/admin/products");
    return { status: "success", message: `Added ${material.name}.` };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

export async function updateRawMaterialAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const material = await updateRawMaterial(context, actor, {
      id: formString(formData, "id"),
      name: formString(formData, "name"),
      unit: formString(formData, "unit"),
      kind: formMaterialKind(formData),
      costPerUnit: formMoneyMinorUnit(formData, "costPerUnit"),
      stockOnHand: formNumber(formData, "stockOnHand", 0),
      lowStockThreshold: formNumber(formData, "lowStockThreshold", 0),
      supplier: formOptionalString(formData, "supplier")
    });

    revalidatePath("/admin/materials");
    revalidatePath("/admin/products");
    revalidatePath("/admin/financial");
    return { status: "success", message: `Saved ${material.name}.` };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

export async function createMaterialPurchaseAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const purchase = await createMaterialPurchase(context, actor, {
      materialId: formString(formData, "materialId"),
      quantity: formNumber(formData, "quantity"),
      totalCost: formMoneyMinorUnit(formData, "totalCost"),
      date: formDate(formData, "date"),
      supplier: formOptionalString(formData, "supplier"),
      note: formOptionalString(formData, "note"),
      expenseCategoryId: formOptionalString(formData, "expenseCategoryId")
    });

    revalidatePath("/admin/materials");
    revalidatePath("/admin/products");
    revalidatePath("/admin/financial");
    return {
      status: "success",
      message: `Received. Unit cost is now ${formatMoney(purchase.unitCostAfter)}.`
    };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

const RECIPE_FIELD_PREFIX = "recipeQuantity.";

/**
 * Saves one variant's bill of materials. This is the single recipe editor —
 * the Products page shows the resulting cost read-only and links here, so
 * there is never a second place where a recipe can be changed.
 */
export async function updateRecipeAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const recipe: { materialId: string; quantityPerUnit: number }[] = [];
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith(RECIPE_FIELD_PREFIX) || typeof value !== "string") {
        continue;
      }
      const quantity = Number.parseFloat(value);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        continue;
      }
      recipe.push({ materialId: key.slice(RECIPE_FIELD_PREFIX.length), quantityPerUnit: quantity });
    }

    const variant = await updateVariant(context, actor, {
      productId: formString(formData, "productId"),
      id: formString(formData, "variantId"),
      recipe
    });

    revalidatePath("/admin/materials");
    revalidatePath("/admin/products");
    revalidatePath("/admin/financial");

    return {
      status: "success",
      message:
        recipe.length === 0
          ? "Recipe cleared — cost is back to whatever is set by hand on the product."
          : `Saved. ${variant.title} now costs ${formatMoney(variant.cost ?? 0)} to make.`
    };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

export async function recordProductionRunAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const run = await recordProductionRun(context, actor, {
      productId: formString(formData, "productId"),
      variantId: formString(formData, "variantId"),
      quantityProduced: Math.round(formNumber(formData, "quantityProduced")),
      note: formOptionalString(formData, "note")
    });

    revalidatePath("/admin/materials");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");

    const shortfall =
      run.shortfallMaterialNames.length > 0
        ? ` Stock went negative on ${run.shortfallMaterialNames.join(", ")} — worth a recount.`
        : "";

    return {
      status: "success",
      message: `Recorded ${run.quantityProduced} × ${run.variantTitle} at ${formatMoney(run.unitCost)} each.${shortfall}`
    };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

export async function deleteRawMaterialAction(materialId: string): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await deleteRawMaterial(context, actor, materialId);

    revalidatePath("/admin/materials");
    revalidatePath("/admin/products");
    return { status: "success", message: "Material deleted." };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

function formMaterialKind(formData: FormData) {
  const value = formOptionalString(formData, "kind");
  return value === "PACKAGING" || value === "OTHER" ? value : "INGREDIENT";
}

function requireCommerceContext() {
  const context = getCommerceServerContext();
  if (!context) {
    throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
  }

  return context;
}

function getActionErrorMessage(error: unknown) {
  if (error instanceof CommerceError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Save failed.";
}
