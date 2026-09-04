"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import { createCapitalAsset, deleteCapitalAsset, updateCapitalAsset } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import {
  formDate,
  formMoneyMinorUnit,
  formOptionalInteger,
  formOptionalString,
  formString,
  type AdminActionState
} from "@/lib/admin/product-form";
import type { CapitalAssetCategory } from "@/lib/commerce/types";

const assetCategories: CapitalAssetCategory[] = ["EQUIPMENT", "FURNITURE", "MACHINE", "PROPERTY", "OTHER"];

export async function createCapitalAssetAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    const trackDepreciation = formData.get("trackDepreciation") === "on";

    const asset = await createCapitalAsset(context, actor, {
      name: formString(formData, "name"),
      category: formAssetCategory(formData),
      purchaseDate: formDate(formData, "purchaseDate"),
      purchaseCost: formMoneyMinorUnit(formData, "purchaseCost"),
      location: formOptionalString(formData, "location"),
      notes: formOptionalString(formData, "notes"),
      trackDepreciation,
      usefulLifeYears: trackDepreciation ? (formOptionalInteger(formData, "usefulLifeYears") ?? null) : null
    });

    return `Added asset ${asset.name}.`;
  }, "/admin/assets", "/admin/financial");
}

export async function updateCapitalAssetAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    const trackDepreciation = formData.get("trackDepreciation") === "on";

    const asset = await updateCapitalAsset(context, actor, {
      id: formString(formData, "id"),
      name: formString(formData, "name"),
      category: formAssetCategory(formData),
      purchaseDate: formDate(formData, "purchaseDate"),
      purchaseCost: formMoneyMinorUnit(formData, "purchaseCost"),
      location: formOptionalString(formData, "location"),
      notes: formOptionalString(formData, "notes"),
      trackDepreciation,
      usefulLifeYears: trackDepreciation ? (formOptionalInteger(formData, "usefulLifeYears") ?? null) : null
    });

    return `Saved ${asset.name}.`;
  }, "/admin/assets", "/admin/financial");
}

export async function deleteCapitalAssetAction(assetId: string): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await deleteCapitalAsset(context, actor, assetId);
    return "Asset deleted.";
  }, "/admin/assets", "/admin/financial");
}

function formAssetCategory(formData: FormData): CapitalAssetCategory {
  const value = formString(formData, "category");
  const match = assetCategories.find((category) => category === value);
  if (!match) {
    throw new CommerceError("VALIDATION_ERROR", "Choose a valid asset category.");
  }

  return match;
}

async function runAction(operation: () => Promise<string>, ...paths: string[]): Promise<AdminActionState> {
  try {
    const message = await operation();
    for (const path of paths) {
      revalidatePath(path);
    }
    return { status: "success", message };
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
