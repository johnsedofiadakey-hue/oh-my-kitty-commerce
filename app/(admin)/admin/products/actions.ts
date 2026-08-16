"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import {
  createProduct,
  createVariant,
  updateProduct
} from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import {
  formInteger,
  formMoneyMinorUnit,
  formOptionalString,
  formProductStatus,
  formString,
  slugFromTitle,
  type AdminActionState
} from "@/lib/admin/product-form";

export async function createProductWithDefaultVariantAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAdminProductAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    const title = formString(formData, "title");
    const slug = formOptionalString(formData, "slug") ?? slugFromTitle(title);

    const product = await createProduct(context, actor, {
      title,
      slug,
      shortCopy: formOptionalString(formData, "shortCopy"),
      status: formProductStatus(formData, "status"),
      categoryIds: [],
      collectionIds: [],
      tags: [],
      mediaIds: [],
      featured: false
    });

    await createVariant(context, actor, {
      productId: product.id,
      title: formOptionalString(formData, "variantTitle") ?? "Default",
      sku: formString(formData, "sku"),
      optionValues: {},
      price: formMoneyMinorUnit(formData, "price"),
      currency: "GHS",
      mediaIds: [],
      trackInventory: true,
      stockOnHand: formInteger(formData, "stockOnHand", 0),
      lowStockThreshold: formInteger(formData, "lowStockThreshold", 5),
      active: true
    });

    return `Created ${product.title}.`;
  });
}

export async function createVariantAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAdminProductAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const variant = await createVariant(context, actor, {
      productId: formString(formData, "productId"),
      title: formString(formData, "variantTitle"),
      sku: formString(formData, "sku"),
      optionValues: {},
      price: formMoneyMinorUnit(formData, "price"),
      currency: "GHS",
      mediaIds: [],
      trackInventory: true,
      stockOnHand: formInteger(formData, "stockOnHand", 0),
      lowStockThreshold: formInteger(formData, "lowStockThreshold", 5),
      active: true
    });

    return `Added variant ${variant.sku}.`;
  });
}

export async function updateProductStatusAction(formData: FormData): Promise<void> {
  const context = requireCommerceContext();
  const actor = await getRequiredAdminActor();

  await updateProduct(context, actor, {
    id: formString(formData, "productId"),
    status: formProductStatus(formData, "status")
  });

  revalidatePath("/admin/products");
}

async function runAdminProductAction(
  operation: () => Promise<string>
): Promise<AdminActionState> {
  try {
    const message = await operation();
    revalidatePath("/admin/products");
    return {
      status: "success",
      message
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionErrorMessage(error)
    };
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
