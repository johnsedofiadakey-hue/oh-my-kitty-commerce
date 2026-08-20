"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import { attachCategoryImage, createCategory, updateCategory } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import {
  formInteger,
  formOptionalString,
  formString,
  slugFromTitle,
  type AdminActionState
} from "@/lib/admin/product-form";

export async function createCategoryAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    const title = formString(formData, "title");

    const category = await createCategory(context, actor, {
      title,
      slug: formOptionalString(formData, "slug") ?? slugFromTitle(title),
      description: formOptionalString(formData, "description"),
      sortOrder: formInteger(formData, "sortOrder", 0)
    });

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath("/shop");
    return { status: "success", message: `Created category ${category.title}.` };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

export async function quickEditCategoryAction(formData: FormData): Promise<void> {
  const context = requireCommerceContext();
  const actor = await getRequiredAdminActor();

  await updateCategory(context, actor, {
    id: formString(formData, "id"),
    title: formString(formData, "title"),
    sortOrder: formInteger(formData, "sortOrder", 0),
    active: formData.get("active") === "on"
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/shop");
}

export async function attachCategoryImageAction(input: {
  categoryId: string;
  storagePath: string;
  url: string;
  alt: string;
}): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await attachCategoryImage(context, actor, input);

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath("/shop");
    return { status: "success", message: "Image updated." };
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
