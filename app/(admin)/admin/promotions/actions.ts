"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import { createPromotion, updatePromotion } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { formString, type AdminActionState } from "@/lib/admin/product-form";

export async function createPromotionAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const promotion = await createPromotion(context, actor, {
      code: formString(formData, "code"),
      type: formPromotionType(formData),
      value: formValue(formData),
      requiresManagerApproval: formData.get("requiresManagerApproval") === "on"
    });

    revalidatePath("/admin/promotions");
    return { status: "success", message: `Created ${promotion.code}.` };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

export async function updatePromotionAction(formData: FormData): Promise<void> {
  const context = requireCommerceContext();
  const actor = await getRequiredAdminActor();

  await updatePromotion(context, actor, {
    id: formString(formData, "id"),
    value: formValue(formData),
    active: formData.get("active") === "on",
    requiresManagerApproval: formData.get("requiresManagerApproval") === "on"
  });

  revalidatePath("/admin/promotions");
}

function formPromotionType(formData: FormData): "PERCENT" | "AMOUNT" {
  return formString(formData, "type") === "AMOUNT" ? "AMOUNT" : "PERCENT";
}

function formValue(formData: FormData): number {
  const raw = formString(formData, "value");
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new CommerceError("VALIDATION_ERROR", "Value must be a positive number.");
  }

  return value;
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
