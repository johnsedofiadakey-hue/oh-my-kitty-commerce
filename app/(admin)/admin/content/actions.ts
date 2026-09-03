"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import { createMediaAsset, deleteMediaAsset, updateContentBlock } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { formString, type AdminActionState } from "@/lib/admin/product-form";

export async function updateContentBlockAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    await updateContentBlock(context, actor, {
      key: formString(formData, "key"),
      value: formString(formData, "value")
    });

    revalidatePath("/admin/content");
    revalidatePath("/contact");
    revalidatePath("/delivery");
    revalidatePath("/faq");
    revalidatePath("/returns");
    return { status: "success", message: "Saved." };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

export async function uploadGeneralMediaAction(input: {
  storagePath: string;
  url: string;
  alt: string;
}): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await createMediaAsset(context, actor, { ...input, usage: ["general"] });

    revalidatePath("/admin/content");
    return { status: "success", message: "Uploaded." };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

export async function deleteMediaAssetAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    await deleteMediaAsset(context, actor, formString(formData, "id"));
    revalidatePath("/admin/content");
    return { status: "success", message: "Deleted." };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
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

function requireCommerceContext() {
  const context = getCommerceServerContext();
  if (!context) {
    throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
  }

  return context;
}
