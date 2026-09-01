"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import { createRawMaterial, deleteRawMaterial, updateRawMaterial } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import {
  formMoneyMinorUnit,
  formOptionalString,
  formString,
  type AdminActionState
} from "@/lib/admin/product-form";

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
      costPerUnit: formMoneyMinorUnit(formData, "costPerUnit"),
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
      costPerUnit: formMoneyMinorUnit(formData, "costPerUnit"),
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
