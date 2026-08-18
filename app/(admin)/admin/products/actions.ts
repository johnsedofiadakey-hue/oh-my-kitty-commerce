"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import {
  adjustInventory,
  createProduct,
  createVariant,
  updateProduct,
  updateVariant
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
      featured: false,
      bestSeller: formData.get("bestSeller") === "on"
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

export async function quickEditCatalogueItemAction(formData: FormData): Promise<void> {
  const context = requireCommerceContext();
  const actor = await getRequiredAdminActor();
  const productId = formString(formData, "productId");
  const variantId = formString(formData, "variantId");
  const categoryId = formOptionalString(formData, "categoryId");
  const stockDelta = formInteger(formData, "stockDelta", 0);

  await updateProduct(context, actor, {
    id: productId,
    title: formString(formData, "title"),
    shortCopy: formOptionalString(formData, "shortCopy"),
    status: formProductStatus(formData, "status"),
    categoryIds: categoryId ? [categoryId] : [],
    concernIds: formData.getAll("concernIds").map(String),
    productTypeIds: formData.getAll("productTypeIds").map(String),
    routineIds: formData.getAll("routineIds").map(String),
    bestSeller: formData.get("bestSeller") === "on"
  });

  await updateVariant(context, actor, {
    productId,
    id: variantId,
    title: formString(formData, "variantTitle"),
    price: formMoneyMinorUnit(formData, "price"),
    lowStockThreshold: formInteger(formData, "lowStockThreshold", 5)
  });

  if (stockDelta !== 0) {
    await adjustInventory(context, actor, {
      productId,
      variantId,
      type: "MANUAL_ADJUSTMENT",
      quantityDelta: stockDelta,
      reason: "Admin quick edit"
    });
  }

  revalidatePath("/");
  revalidatePath("/shop");
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
