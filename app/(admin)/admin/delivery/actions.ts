"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import { createDeliveryRule, updateDeliveryRule } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import {
  formInteger,
  formMoneyMinorUnit,
  formOptionalString,
  formString,
  type AdminActionState
} from "@/lib/admin/product-form";

export async function createDeliveryRuleAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const rule = await createDeliveryRule(context, actor, {
      name: formString(formData, "name"),
      type: formDeliveryType(formData),
      regions: parseRegions(formData),
      fee: formMoneyMinorUnit(formData, "fee"),
      estimate: formOptionalString(formData, "estimate"),
      sortOrder: formInteger(formData, "sortOrder", 0)
    });

    revalidatePath("/admin/delivery");
    return { status: "success", message: `Created ${rule.name}.` };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

export async function quickEditDeliveryRuleAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const rule = await updateDeliveryRule(context, actor, {
      id: formString(formData, "id"),
      name: formString(formData, "name"),
      fee: formMoneyMinorUnit(formData, "fee"),
      estimate: formOptionalString(formData, "estimate"),
      sortOrder: formInteger(formData, "sortOrder", 0),
      active: formData.get("active") === "on"
    });

    revalidatePath("/admin/delivery");
    revalidatePath("/cart");
    revalidatePath("/checkout");
    return { status: "success", message: `Saved ${rule.name}.` };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

function formDeliveryType(formData: FormData): "PICKUP" | "LOCAL_DELIVERY" | "NATIONWIDE_DELIVERY" {
  const value = formString(formData, "type");
  if (value === "PICKUP" || value === "LOCAL_DELIVERY" || value === "NATIONWIDE_DELIVERY") {
    return value;
  }
  return "LOCAL_DELIVERY";
}

function parseRegions(formData: FormData): string[] {
  const raw = formString(formData, "regions");
  return raw
    .split(",")
    .map((region) => region.trim())
    .filter(Boolean);
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
