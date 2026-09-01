import {
  defaultRoles,
  getHighestRoleLimit,
  hasPermission,
  type Permission,
  type Role,
  type UserAccess
} from "@/lib/permissions/permissions";
import { CommerceError } from "@/lib/commerce/errors";
import type { CommerceRepository, CommerceTransaction } from "@/lib/commerce/repository";
import { createNoopTransaction } from "@/lib/commerce/repository";
import {
  adjustInventoryInputSchema,
  attachCategoryImageInputSchema,
  completeSaleInputSchema,
  createCategoryInputSchema,
  createConcernInputSchema,
  createCustomerInputSchema,
  createDeliveryRuleInputSchema,
  updateDeliveryRuleInputSchema,
  createRoleInputSchema,
  createStaffUserInputSchema,
  updateRoleInputSchema,
  updateStaffUserInputSchema,
  updateStoreSettingsInputSchema,
  updateCustomerInputSchema,
  updatePromotionInputSchema,
  updateOrderFulfilmentInputSchema,
  updateContentBlockInputSchema,
  createMediaAssetInputSchema,
  attachProductImageInputSchema,
  posReversalInputSchema,
  createOrderDraftInputSchema,
  createProductInputSchema,
  createProductTypeInputSchema,
  createPromotionInputSchema,
  createRoutineInputSchema,
  createVariantInputSchema,
  updateCategoryInputSchema,
  updateConcernInputSchema,
  updateProductInputSchema,
  updateProductTypeInputSchema,
  updateRoutineInputSchema,
  updateVariantInputSchema,
  type AdjustInventoryInput,
  type AttachCategoryImageInput,
  type CompleteSaleInput,
  type CreateCustomerInput,
  type CreateOrderDraftInput,
  type CreateProductInput,
  type CreateVariantInput,
  type ParsedCompleteSaleInput,
  type ParsedCreateOrderDraftInput,
  type UpdateCustomerInput,
  type UpdateOrderFulfilmentInput,
  type UpdateContentBlockInput,
  type CreateMediaAssetInput,
  type AttachProductImageInput,
  type UpdatePromotionInput,
  type UpdateProductInput,
  type UpdateVariantInput,
  type PosReversalInput
} from "@/lib/commerce/schemas";
import type {
  AuditLog,
  Category,
  Concern,
  ContentBlock,
  Customer,
  DeliveryRule,
  InventoryMovement,
  InventoryMovementType,
  MediaAsset,
  Order,
  OrderItem,
  Payment,
  Product,
  ProductType,
  ProductVariant,
  Promotion,
  Routine,
  SalesChannel,
  StaffUser,
  StoreSettings
} from "@/lib/commerce/types";
import { notifyAdminOfNewOrder, notifyOrderEvent } from "@/lib/notifications/order-notifications";

export type CommerceActor = UserAccess & {
  system?: boolean;
  displayName?: string;
  email?: string;
};

export type CommerceContext = {
  repo: CommerceRepository;
  roles?: Role[];
  now?: () => Date;
  id?: (prefix: string) => string;
  transaction?: CommerceTransaction;
};

export type CompletedSale = {
  order: Order;
  payment: Payment | null;
  inventoryMovements: InventoryMovement[];
  idempotent: boolean;
};

export async function createProduct(
  context: CommerceContext,
  actor: CommerceActor,
  input: CreateProductInput
) {
  await assertCan(context, actor, "products.create");
  const parsed = createProductInputSchema.parse(input);
  const now = getNow(context);
  const product: Product = {
    ...parsed,
    id: createSlugId("product", parsed.slug),
    createdAt: now,
    updatedAt: now
  };

  await context.repo.saveProduct(product);
  await writeAuditLog(context, actor, {
    action: "products.create",
    entityType: "product",
    entityId: product.id,
    summary: `Created product ${product.title}`
  });

  return product;
}

export async function updateProduct(
  context: CommerceContext,
  actor: CommerceActor,
  input: UpdateProductInput
) {
  await assertCan(context, actor, "products.update");
  const parsed = updateProductInputSchema.parse(input);
  const existing = await requiredProduct(context, parsed.id);
  const product: Product = {
    ...existing,
    ...parsed,
    id: existing.id,
    updatedAt: getNow(context)
  };

  await context.repo.saveProduct(product);
  await writeAuditLog(context, actor, {
    action: "products.update",
    entityType: "product",
    entityId: product.id,
    summary: `Updated product ${product.title}`
  });

  return product;
}

/**
 * Permanently removes a product and all its variants. Order line items are
 * a snapshot (title, price, image copied at purchase time) rather than a
 * live reference, so past orders keep displaying correctly after this —
 * but inventory movement history and any promotion restricted to this
 * product will be left pointing at an id that no longer resolves. That's a
 * deliberate tradeoff for a real delete instead of an archive.
 */
export async function deleteProduct(context: CommerceContext, actor: CommerceActor, productId: string) {
  await assertCan(context, actor, "products.delete");
  const product = await requiredProduct(context, productId);
  const variants = await context.repo.listVariants(productId);

  for (const variant of variants) {
    await context.repo.deleteVariant(productId, variant.id);
  }
  await context.repo.deleteProduct(productId);

  await writeAuditLog(context, actor, {
    action: "products.delete",
    entityType: "product",
    entityId: productId,
    summary: `Deleted product ${product.title} (${variants.length} variant${variants.length === 1 ? "" : "s"})`
  });
}

export type BulkDeleteResult = {
  deletedCount: number;
  deletedTitles: string[];
  failed: { productId: string; message: string }[];
};

/**
 * Deletes many products in one call. Each product is removed independently —
 * one failing (already gone, bad permission mid-batch, etc.) doesn't abort
 * the rest — so the caller can show the customer exactly what went through
 * and what didn't, rather than an all-or-nothing batch.
 */
export async function deleteProducts(
  context: CommerceContext,
  actor: CommerceActor,
  productIds: string[]
): Promise<BulkDeleteResult> {
  const result: BulkDeleteResult = { deletedCount: 0, deletedTitles: [], failed: [] };

  for (const productId of productIds) {
    try {
      const product = await requiredProduct(context, productId);
      await deleteProduct(context, actor, productId);
      result.deletedCount += 1;
      result.deletedTitles.push(product.title);
    } catch (error) {
      result.failed.push({
        productId,
        message: error instanceof CommerceError ? error.message : "Delete failed."
      });
    }
  }

  return result;
}

export async function createVariant(
  context: CommerceContext,
  actor: CommerceActor,
  input: CreateVariantInput
) {
  await assertCan(context, actor, "products.update");
  const parsed = createVariantInputSchema.parse(input);
  await requiredProduct(context, parsed.productId);

  const variant: ProductVariant = {
    ...parsed,
    id: createSlugId("variant", parsed.sku.toLowerCase()),
    stockAvailable: input.stockAvailable === undefined ? parsed.stockOnHand : parsed.stockAvailable
  };

  await context.repo.saveVariant(variant);
  await writeAuditLog(context, actor, {
    action: "variants.create",
    entityType: "productVariant",
    entityId: variant.id,
    summary: `Created variant ${variant.sku}`
  });

  return variant;
}

export async function updateVariant(
  context: CommerceContext,
  actor: CommerceActor,
  input: UpdateVariantInput
) {
  const parsed = updateVariantInputSchema.parse(input);
  const existing = await requiredVariant(context, parsed.productId, parsed.id);

  if (parsed.price !== undefined && parsed.price !== existing.price) {
    await assertCan(context, actor, "products.price.update");
  } else {
    await assertCan(context, actor, "products.update");
  }

  if (
    (parsed.stockOnHand !== undefined && parsed.stockOnHand !== existing.stockOnHand) ||
    (parsed.stockAvailable !== undefined && parsed.stockAvailable !== existing.stockAvailable)
  ) {
    throw new CommerceError(
      "INVALID_STATE",
      "Use adjustInventory for stock changes so the movement is ledgered."
    );
  }

  const variant: ProductVariant = {
    ...existing,
    ...parsed,
    productId: existing.productId,
    id: existing.id,
    stockOnHand: existing.stockOnHand,
    stockAvailable: existing.stockAvailable
  };

  await context.repo.saveVariant(variant);
  await writeAuditLog(context, actor, {
    action: "variants.update",
    entityType: "productVariant",
    entityId: variant.id,
    summary: `Updated variant ${variant.sku}`
  });

  return variant;
}

export async function adjustInventory(
  context: CommerceContext,
  actor: CommerceActor,
  input: AdjustInventoryInput
) {
  await assertCan(context, actor, "inventory.adjust");
  const parsed = adjustInventoryInputSchema.parse(input);

  return withTransaction(context, async () => {
    const variant = await requiredVariant(context, parsed.productId, parsed.variantId);
    const stockOnHand = variant.stockOnHand + parsed.quantityDelta;
    const stockAvailable = variant.stockAvailable + parsed.quantityDelta;

    if (stockOnHand < 0 || stockAvailable < 0) {
      throw new CommerceError("OUT_OF_STOCK", "Inventory adjustment would create negative stock.");
    }

    const updatedVariant: ProductVariant = {
      ...variant,
      stockOnHand,
      stockAvailable
    };

    const movement: InventoryMovement = {
      id: createId(context, "movement"),
      productId: parsed.productId,
      variantId: parsed.variantId,
      type: parsed.type,
      quantityDelta: parsed.quantityDelta,
      stockAfter: stockAvailable,
      reason: parsed.reason,
      actorId: actor.uid,
      createdAt: getNow(context)
    };

    await context.repo.saveVariant(updatedVariant);
    await context.repo.saveInventoryMovement(movement);
    await writeAuditLog(context, actor, {
      action: "inventory.adjust",
      entityType: "inventoryMovement",
      entityId: movement.id,
      summary: `Adjusted stock for ${variant.sku}`,
      reason: parsed.reason
    });

    return { variant: updatedVariant, movement };
  });
}

export async function createCustomer(
  context: CommerceContext,
  actor: CommerceActor,
  input: CreateCustomerInput
) {
  await assertCan(context, actor, "customers.create");
  const parsed = createCustomerInputSchema.parse(input);
  const customer: Customer = {
    ...parsed,
    id: createId(context, "customer")
  };

  await context.repo.saveCustomer(customer);
  await writeAuditLog(context, actor, {
    action: "customers.create",
    entityType: "customer",
    entityId: customer.id,
    summary: "Created customer"
  });

  return customer;
}

export async function updateCustomer(
  context: CommerceContext,
  actor: CommerceActor,
  input: UpdateCustomerInput
) {
  await assertCan(context, actor, "customers.update");
  const parsed = updateCustomerInputSchema.parse(input);
  const existing = await context.repo.getCustomer(parsed.id);
  if (!existing) {
    throw new CommerceError("NOT_FOUND", `Customer not found: ${parsed.id}`);
  }

  const customer: Customer = { ...existing, ...parsed, id: existing.id };

  await context.repo.saveCustomer(customer);
  await writeAuditLog(context, actor, {
    action: "customers.update",
    entityType: "customer",
    entityId: customer.id,
    summary: "Updated customer"
  });

  return customer;
}

export async function createPromotion(
  context: CommerceContext,
  actor: CommerceActor,
  input: unknown
) {
  await assertCan(context, actor, "promotions.create");
  const parsed = createPromotionInputSchema.parse(input);
  const promotion: Promotion = {
    ...parsed,
    id: createSlugId("promo", parsed.code.toLowerCase()),
    startsAt: null,
    endsAt: null,
    usedCount: 0
  };

  await context.repo.savePromotion(promotion);
  await writeAuditLog(context, actor, {
    action: "promotions.create",
    entityType: "promotion",
    entityId: promotion.id,
    summary: `Created promotion ${promotion.code}`
  });

  return promotion;
}

export async function updatePromotion(
  context: CommerceContext,
  actor: CommerceActor,
  input: UpdatePromotionInput
) {
  await assertCan(context, actor, "promotions.update");
  const parsed = updatePromotionInputSchema.parse(input);
  const existing = await requiredEntity(await context.repo.listPromotions(), parsed.id, "Promotion");
  const promotion: Promotion = { ...existing, ...parsed, id: existing.id };

  await context.repo.savePromotion(promotion);
  await writeAuditLog(context, actor, {
    action: "promotions.update",
    entityType: "promotion",
    entityId: promotion.id,
    summary: `Updated promotion ${promotion.code}`
  });

  return promotion;
}

export type PromotionEvaluationLine = {
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
};

export type PromotionEvaluation = {
  promotion: Promotion;
  discountTotal: number;
  lineDiscounts: Map<string, number>;
};

/**
 * Checks a promo code against the current cart and computes the discount —
 * pure validation, no side effects (usedCount is only incremented once an
 * order actually completes, via redeemPromotion). Always re-run this
 * server-side before completing a sale; never trust a client-supplied
 * discount amount.
 */
export async function evaluatePromotionCode(
  context: CommerceContext,
  input: {
    code: string;
    channel: SalesChannel;
    items: PromotionEvaluationLine[];
  }
): Promise<PromotionEvaluation> {
  const normalizedCode = input.code.trim().toUpperCase();
  if (!normalizedCode) {
    throw new CommerceError("VALIDATION_ERROR", "Enter a promo code.");
  }

  const promotions = await context.repo.listPromotions();
  const promotion = promotions.find((entry) => entry.code.toUpperCase() === normalizedCode);
  if (!promotion) {
    throw new CommerceError("VALIDATION_ERROR", "That code isn't valid.");
  }

  if (!promotion.active) {
    throw new CommerceError("VALIDATION_ERROR", "That code is no longer active.");
  }

  // Firestore Timestamps aren't real Date instances at runtime — guard with
  // instanceof rather than trusting the static type, same reason this
  // codebase has toRealDate/toSortableMillis helpers elsewhere.
  const now = getNow(context);
  if (promotion.startsAt instanceof Date && now < promotion.startsAt) {
    throw new CommerceError("VALIDATION_ERROR", "That code isn't active yet.");
  }
  if (promotion.endsAt instanceof Date && now > promotion.endsAt) {
    throw new CommerceError("VALIDATION_ERROR", "That code has expired.");
  }
  if (promotion.usageLimit != null && promotion.usedCount >= promotion.usageLimit) {
    throw new CommerceError("VALIDATION_ERROR", "That code has reached its usage limit.");
  }
  if (promotion.channelRestrictions.length > 0 && !promotion.channelRestrictions.includes(input.channel)) {
    throw new CommerceError("VALIDATION_ERROR", "That code isn't valid for this order type.");
  }

  let categoriesByProductId: Map<string, string[]> | null = null;
  if (promotion.categoryRestrictions.length > 0) {
    const products = await context.repo.listProducts();
    categoriesByProductId = new Map(products.map((product) => [product.id, product.categoryIds ?? []]));
  }

  const matchingItems = input.items.filter((item) => {
    if (promotion.productRestrictions.length > 0 && !promotion.productRestrictions.includes(item.productId)) {
      return false;
    }
    if (promotion.categoryRestrictions.length > 0) {
      const productCategories = categoriesByProductId?.get(item.productId) ?? [];
      if (!productCategories.some((categoryId) => promotion.categoryRestrictions.includes(categoryId))) {
        return false;
      }
    }
    return true;
  });

  if (matchingItems.length === 0) {
    throw new CommerceError("VALIDATION_ERROR", "That code doesn't apply to anything in your cart.");
  }

  const matchingSubtotal = matchingItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  const rawDiscount =
    promotion.type === "PERCENT"
      ? Math.round((matchingSubtotal * promotion.value) / 100)
      : Math.min(promotion.value, matchingSubtotal);

  // Split the discount proportionally across matching lines by their share
  // of the matching subtotal — the last line absorbs any rounding remainder
  // so the parts always sum exactly to rawDiscount.
  const lineDiscounts = new Map<string, number>();
  let remaining = rawDiscount;
  matchingItems.forEach((item, index) => {
    const lineTotal = item.unitPrice * item.quantity;
    const isLast = index === matchingItems.length - 1;
    const share = isLast ? remaining : Math.round((rawDiscount * lineTotal) / matchingSubtotal);
    lineDiscounts.set(item.variantId, share);
    remaining -= share;
  });

  return { promotion, discountTotal: rawDiscount, lineDiscounts };
}

/** Called once per order, only after it's genuinely confirmed/completed — never at draft/pending time. */
export async function redeemPromotion(context: CommerceContext, promotionId: string): Promise<void> {
  await withTransaction(context, async () => {
    const promotions = await context.repo.listPromotions();
    const promotion = promotions.find((entry) => entry.id === promotionId);
    if (!promotion) {
      return;
    }

    await context.repo.savePromotion({ ...promotion, usedCount: promotion.usedCount + 1 });
  });
}

export async function createConcern(context: CommerceContext, actor: CommerceActor, input: unknown) {
  await assertCan(context, actor, "products.update");
  const parsed = createConcernInputSchema.parse(input);
  const concern: Concern = { ...parsed, id: createSlugId("concern", parsed.slug) };

  await context.repo.saveConcern(concern);
  await writeAuditLog(context, actor, {
    action: "concerns.create",
    entityType: "concern",
    entityId: concern.id,
    summary: `Created concern ${concern.title}`
  });

  return concern;
}

export async function updateConcern(context: CommerceContext, actor: CommerceActor, input: unknown) {
  await assertCan(context, actor, "products.update");
  const parsed = updateConcernInputSchema.parse(input);
  const existing = await requiredEntity(await context.repo.listConcerns(), parsed.id, "Concern");
  const concern: Concern = { ...existing, ...parsed, id: existing.id };

  await context.repo.saveConcern(concern);
  await writeAuditLog(context, actor, {
    action: "concerns.update",
    entityType: "concern",
    entityId: concern.id,
    summary: `Updated concern ${concern.title}`
  });

  return concern;
}

export async function createProductType(
  context: CommerceContext,
  actor: CommerceActor,
  input: unknown
) {
  await assertCan(context, actor, "products.update");
  const parsed = createProductTypeInputSchema.parse(input);
  const productType: ProductType = { ...parsed, id: createSlugId("type", parsed.slug) };

  await context.repo.saveProductType(productType);
  await writeAuditLog(context, actor, {
    action: "productTypes.create",
    entityType: "productType",
    entityId: productType.id,
    summary: `Created product type ${productType.title}`
  });

  return productType;
}

export async function updateProductType(
  context: CommerceContext,
  actor: CommerceActor,
  input: unknown
) {
  await assertCan(context, actor, "products.update");
  const parsed = updateProductTypeInputSchema.parse(input);
  const existing = await requiredEntity(await context.repo.listProductTypes(), parsed.id, "Product type");
  const productType: ProductType = { ...existing, ...parsed, id: existing.id };

  await context.repo.saveProductType(productType);
  await writeAuditLog(context, actor, {
    action: "productTypes.update",
    entityType: "productType",
    entityId: productType.id,
    summary: `Updated product type ${productType.title}`
  });

  return productType;
}

export async function createRoutine(context: CommerceContext, actor: CommerceActor, input: unknown) {
  await assertCan(context, actor, "products.update");
  const parsed = createRoutineInputSchema.parse(input);
  const routine: Routine = { ...parsed, id: createSlugId("routine", parsed.slug) };

  await context.repo.saveRoutine(routine);
  await writeAuditLog(context, actor, {
    action: "routines.create",
    entityType: "routine",
    entityId: routine.id,
    summary: `Created routine ${routine.title}`
  });

  return routine;
}

export async function updateRoutine(context: CommerceContext, actor: CommerceActor, input: unknown) {
  await assertCan(context, actor, "products.update");
  const parsed = updateRoutineInputSchema.parse(input);
  const existing = await requiredEntity(await context.repo.listRoutines(), parsed.id, "Routine");
  const routine: Routine = { ...existing, ...parsed, id: existing.id };

  await context.repo.saveRoutine(routine);
  await writeAuditLog(context, actor, {
    action: "routines.update",
    entityType: "routine",
    entityId: routine.id,
    summary: `Updated routine ${routine.title}`
  });

  return routine;
}

export async function createCategory(context: CommerceContext, actor: CommerceActor, input: unknown) {
  await assertCan(context, actor, "products.update");
  const parsed = createCategoryInputSchema.parse(input);
  const category: Category = { ...parsed, id: createSlugId("category", parsed.slug) };

  await context.repo.saveCategory(category);
  await writeAuditLog(context, actor, {
    action: "categories.create",
    entityType: "category",
    entityId: category.id,
    summary: `Created category ${category.title}`
  });

  return category;
}

export async function updateCategory(context: CommerceContext, actor: CommerceActor, input: unknown) {
  await assertCan(context, actor, "products.update");
  const parsed = updateCategoryInputSchema.parse(input);
  const existing = await requiredEntity(await context.repo.listCategories(), parsed.id, "Category");
  const category: Category = { ...existing, ...parsed, id: existing.id };

  await context.repo.saveCategory(category);
  await writeAuditLog(context, actor, {
    action: "categories.update",
    entityType: "category",
    entityId: category.id,
    summary: `Updated category ${category.title}`
  });

  return category;
}

export async function attachCategoryImage(
  context: CommerceContext,
  actor: CommerceActor,
  input: AttachCategoryImageInput
) {
  await assertCan(context, actor, "media.upload");
  await assertCan(context, actor, "products.update");
  const parsed = attachCategoryImageInputSchema.parse(input);

  const category = await requiredEntity(await context.repo.listCategories(), parsed.categoryId, "Category");
  const asset = await createMediaAsset(context, actor, {
    storagePath: parsed.storagePath,
    url: parsed.url,
    alt: parsed.alt,
    usage: ["category"]
  });

  const updatedCategory: Category = { ...category, mediaId: asset.id };
  await context.repo.saveCategory(updatedCategory);
  await writeAuditLog(context, actor, {
    action: "categories.attach_image",
    entityType: "category",
    entityId: category.id,
    summary: `Set image for ${category.title}`
  });

  return { asset, category: updatedCategory };
}

export async function createDeliveryRule(
  context: CommerceContext,
  actor: CommerceActor,
  input: unknown
) {
  await assertCan(context, actor, "settings.update");
  const parsed = createDeliveryRuleInputSchema.parse(input);
  const deliveryRule: DeliveryRule = {
    ...parsed,
    id: createSlugId("delivery", parsed.name.toLowerCase().replaceAll(" ", "-"))
  };

  await context.repo.saveDeliveryRule(deliveryRule);
  await writeAuditLog(context, actor, {
    action: "deliveryRules.create",
    entityType: "deliveryRule",
    entityId: deliveryRule.id,
    summary: `Created delivery rule ${deliveryRule.name}`
  });

  return deliveryRule;
}

export async function updateDeliveryRule(
  context: CommerceContext,
  actor: CommerceActor,
  input: unknown
) {
  await assertCan(context, actor, "settings.update");
  const parsed = updateDeliveryRuleInputSchema.parse(input);
  const existing = await requiredEntity(await context.repo.listDeliveryRules(), parsed.id, "Delivery rule");
  const deliveryRule: DeliveryRule = { ...existing, ...parsed, id: existing.id };

  await context.repo.saveDeliveryRule(deliveryRule);
  await writeAuditLog(context, actor, {
    action: "deliveryRules.update",
    entityType: "deliveryRule",
    entityId: deliveryRule.id,
    summary: `Updated delivery rule ${deliveryRule.name}`
  });

  return deliveryRule;
}

/**
 * Persists the Firestore side of a staff account. The Firebase Auth user and
 * its custom claims are created by the caller (route/action layer, which
 * talks to firebase-admin/auth directly) — this only records the resulting
 * uid so admin.access/roleIds stay in sync between Auth claims and Firestore.
 */
export async function createStaffUser(
  context: CommerceContext,
  actor: CommerceActor,
  input: unknown
) {
  await assertCan(context, actor, "users.create");
  const parsed = createStaffUserInputSchema.parse(input);
  const staffUser: StaffUser = {
    ...parsed,
    permissionOverrides: parsed.permissionOverrides as Permission[],
    createdBy: actor.uid
  };

  await context.repo.saveStaffUser(staffUser);
  await writeAuditLog(context, actor, {
    action: "users.create",
    entityType: "user",
    entityId: staffUser.id,
    summary: `Invited staff account ${staffUser.email}`
  });

  return staffUser;
}

export async function updateStaffUser(
  context: CommerceContext,
  actor: CommerceActor,
  input: unknown
) {
  await assertCan(context, actor, "users.update");
  const parsed = updateStaffUserInputSchema.parse(input);
  const existing = await context.repo.getStaffUser(parsed.id);
  if (!existing) {
    throw new CommerceError("NOT_FOUND", "Staff account not found.");
  }

  const staffUser: StaffUser = {
    ...existing,
    ...parsed,
    permissionOverrides: (parsed.permissionOverrides ?? existing.permissionOverrides) as
      | Permission[]
      | undefined,
    id: existing.id
  };

  await context.repo.saveStaffUser(staffUser);
  await writeAuditLog(context, actor, {
    action: "users.update",
    entityType: "user",
    entityId: staffUser.id,
    summary: `Updated staff account ${staffUser.email}`
  });

  return staffUser;
}

export async function createRole(context: CommerceContext, actor: CommerceActor, input: unknown) {
  await assertCan(context, actor, "roles.create");
  const parsed = createRoleInputSchema.parse(input);
  const role: Role = {
    id: await uniqueRoleId(context, parsed.name),
    name: parsed.name,
    permissions: parsed.permissions as Permission[],
    limits: parsed.limits
  };

  await context.repo.saveRole(role);
  await writeAuditLog(context, actor, {
    action: "roles.create",
    entityType: "role",
    entityId: role.id,
    summary: `Created role ${role.name}`
  });

  return role;
}

export async function updateRole(context: CommerceContext, actor: CommerceActor, input: unknown) {
  await assertCan(context, actor, "roles.update");
  const parsed = updateRoleInputSchema.parse(input);
  const existing = await context.repo.getRole(parsed.id);
  if (!existing) {
    throw new CommerceError("NOT_FOUND", "Role not found.");
  }

  if (existing.system) {
    throw new CommerceError("VALIDATION_ERROR", "Built-in roles can't be edited.");
  }

  const role: Role = {
    ...existing,
    name: parsed.name ?? existing.name,
    permissions: (parsed.permissions as Permission[] | undefined) ?? existing.permissions,
    limits: parsed.limits ?? existing.limits
  };

  await context.repo.saveRole(role);
  await writeAuditLog(context, actor, {
    action: "roles.update",
    entityType: "role",
    entityId: role.id,
    summary: `Updated role ${role.name}`
  });

  return role;
}

export async function deleteRole(context: CommerceContext, actor: CommerceActor, roleId: string) {
  await assertCan(context, actor, "roles.update");
  const existing = await context.repo.getRole(roleId);
  if (!existing) {
    throw new CommerceError("NOT_FOUND", "Role not found.");
  }

  if (existing.system) {
    throw new CommerceError("VALIDATION_ERROR", "Built-in roles can't be deleted.");
  }

  const staffUsers = await context.repo.listStaffUsers();
  const stillAssigned = staffUsers.some((user) => user.roleIds.includes(roleId));
  if (stillAssigned) {
    throw new CommerceError(
      "VALIDATION_ERROR",
      "This role is still assigned to a staff account — reassign them first."
    );
  }

  await context.repo.deleteRole(roleId);
  await writeAuditLog(context, actor, {
    action: "roles.delete",
    entityType: "role",
    entityId: roleId,
    summary: `Deleted role ${existing.name}`
  });
}

export async function updateStoreSettings(
  context: CommerceContext,
  actor: CommerceActor,
  input: unknown
) {
  await assertCan(context, actor, "settings.update");
  const parsed = updateStoreSettingsInputSchema.parse(input);
  const settings: StoreSettings = {
    id: "store",
    storeName: parsed.storeName,
    receiptFooter: parsed.receiptFooter,
    updatedBy: actor.uid,
    updatedAt: getNow(context)
  };

  await context.repo.saveStoreSettings(settings);
  await writeAuditLog(context, actor, {
    action: "settings.update",
    entityType: "settings",
    entityId: "store",
    summary: "Updated store settings"
  });

  return settings;
}

export async function updateContentBlock(
  context: CommerceContext,
  actor: CommerceActor,
  input: UpdateContentBlockInput
) {
  await assertCan(context, actor, "content.update");
  const parsed = updateContentBlockInputSchema.parse(input);
  const block: ContentBlock = {
    id: parsed.key,
    key: parsed.key,
    value: parsed.value,
    updatedBy: actor.uid,
    updatedAt: getNow(context)
  };

  await context.repo.saveContentBlock(block);
  await writeAuditLog(context, actor, {
    action: "content.update",
    entityType: "contentBlock",
    entityId: block.key,
    summary: `Updated content block ${block.key}`
  });

  return block;
}

export async function createMediaAsset(
  context: CommerceContext,
  actor: CommerceActor,
  input: CreateMediaAssetInput
) {
  await assertCan(context, actor, "media.upload");
  const parsed = createMediaAssetInputSchema.parse(input);
  const asset: MediaAsset = {
    id: createId(context, "media"),
    storagePath: parsed.storagePath,
    url: parsed.url,
    type: "IMAGE",
    visibility: "PUBLIC",
    alt: parsed.alt,
    title: parsed.title,
    tags: [],
    usage: parsed.usage,
    uploadedBy: actor.uid
  };

  await context.repo.saveMedia(asset);
  await writeAuditLog(context, actor, {
    action: "media.upload",
    entityType: "media",
    entityId: asset.id,
    summary: `Uploaded media ${asset.id}`
  });

  return asset;
}

export async function deleteMediaAsset(context: CommerceContext, actor: CommerceActor, mediaId: string) {
  await assertCan(context, actor, "media.delete");

  const [products, categories] = await Promise.all([
    context.repo.listProducts(),
    context.repo.listCategories()
  ]);
  const variants = (
    await Promise.all(products.map((product) => context.repo.listVariants(product.id)))
  ).flat();

  const stillReferenced =
    products.some((product) => product.mediaIds.includes(mediaId)) ||
    variants.some((variant) => variant.mediaIds.includes(mediaId)) ||
    categories.some((category) => category.mediaId === mediaId);

  if (stillReferenced) {
    throw new CommerceError(
      "VALIDATION_ERROR",
      "This image is still used by a product or category — replace it there first."
    );
  }

  await context.repo.deleteMedia(mediaId);
  await writeAuditLog(context, actor, {
    action: "media.delete",
    entityType: "media",
    entityId: mediaId,
    summary: `Deleted media ${mediaId}`
  });
}

/**
 * Uploads a photo and makes it the given variant's primary image in one
 * step — the storefront and every admin list only ever reads
 * `variant.mediaIds[0]`, so "attach an image" means "replace the first
 * slot", not append to a gallery no UI can browse yet.
 */
export async function attachProductImage(
  context: CommerceContext,
  actor: CommerceActor,
  input: AttachProductImageInput
) {
  await assertCan(context, actor, "media.upload");
  await assertCan(context, actor, "products.update");
  const parsed = attachProductImageInputSchema.parse(input);

  const variant = await requiredVariant(context, parsed.productId, parsed.variantId);
  const asset = await createMediaAsset(context, actor, {
    storagePath: parsed.storagePath,
    url: parsed.url,
    alt: parsed.alt,
    usage: ["product"]
  });

  const updatedVariant: ProductVariant = { ...variant, mediaIds: [asset.id] };
  await context.repo.saveVariant(updatedVariant);
  await writeAuditLog(context, actor, {
    action: "products.attach_image",
    entityType: "productVariant",
    entityId: variant.id,
    summary: `Set image for ${variant.sku}`
  });

  return { asset, variant: updatedVariant };
}

export async function openPosShift(
  context: CommerceContext,
  actor: CommerceActor,
  input: { openingCash?: number } = {}
) {
  await assertCan(context, actor, "pos.shift.open");
  const openingCash = parseMoneyMinorUnit(input.openingCash, "openingCash");
  const existingOpenShift = (await context.repo.listPosShifts()).find(
    (shift) => shift.staffId === actor.uid && shift.status === "OPEN"
  );

  if (existingOpenShift) {
    return existingOpenShift;
  }

  const shift = {
    id: createId(context, "shift"),
    staffId: actor.uid,
    status: "OPEN" as const,
    openedAt: getNow(context),
    openingCash
  };

  await context.repo.savePosShift(shift);
  await writeAuditLog(context, actor, {
    action: "pos.shift.open",
    entityType: "posShift",
    entityId: shift.id,
    summary: "Opened POS shift"
  });

  return shift;
}

export async function closePosShift(
  context: CommerceContext,
  actor: CommerceActor,
  input: { id: string; closingCash?: number; notes?: string }
) {
  await assertCan(context, actor, "pos.shift.close");
  const shift = await context.repo.getPosShift(input.id);
  if (!shift || shift.status !== "OPEN") {
    throw new CommerceError("INVALID_STATE", "Only an open POS shift can be closed.");
  }

  const closingCash = parseMoneyMinorUnit(input.closingCash, "closingCash");
  const [orders, payments] = await Promise.all([
    context.repo.listOrders(),
    context.repo.listPayments()
  ]);
  const shiftOrderIds = new Set(
    orders.filter((order) => order.posShiftId === shift.id).map((order) => order.id)
  );
  const cashSales = payments
    .filter((payment) => payment.method === "cash" && shiftOrderIds.has(payment.orderId))
    .reduce((total, payment) => total + payment.amount, 0);
  const expectedCash = shift.openingCash + cashSales;
  const closedShift = {
    ...shift,
    closedAt: getNow(context),
    closingCash,
    difference: closingCash - expectedCash,
    expectedCash,
    notes: input.notes,
    status: "CLOSED" as const
  };

  await context.repo.savePosShift(closedShift);
  await writeAuditLog(context, actor, {
    action: "pos.shift.close",
    entityType: "posShift",
    entityId: shift.id,
    summary: "Closed POS shift"
  });

  return closedShift;
}

export async function createOrderDraft(
  context: CommerceContext,
  actor: CommerceActor,
  input: CreateOrderDraftInput
) {
  await assertCan(context, actor, "orders.update_status");
  const parsed = createOrderDraftInputSchema.parse(input);
  const existingOrder = await context.repo.findOrderByIdempotencyKey(parsed.idempotencyKey);

  if (existingOrder) {
    return existingOrder;
  }

  const order = await buildOrder(context, parsed, {
    status: "DRAFT",
    paymentStatus: "PENDING"
  });

  await context.repo.saveOrder(order);
  await writeAuditLog(context, actor, {
    action: "orders.create_draft",
    entityType: "order",
    entityId: order.id,
    summary: `Created ${order.channel} draft order`
  });

  return order;
}

export async function completePosSale(
  context: CommerceContext,
  actor: CommerceActor,
  input: CompleteSaleInput
) {
  await assertCan(context, actor, "pos.sell");
  const parsed = completeSaleInputSchema.parse({
    ...input,
    channel: "POS",
    staffId: input.staffId ?? actor.uid
  });

  if (parsed.items.some((item) => item.discountTotal > 0)) {
    await assertCan(context, actor, "pos.discount");
  }

  if (parsed.posShiftId) {
    const shift = await context.repo.getPosShift(parsed.posShiftId);
    if (!shift || shift.status !== "OPEN") {
      throw new CommerceError("INVALID_STATE", "POS sale requires an open shift.");
    }
  }

  return completeSale(context, actor, parsed);
}

/**
 * Starts a POS mobile money sale awaiting Paystack confirmation. Mirrors
 * createPendingOnlineOrder below: creates the order as PENDING_PAYMENT /
 * payment PENDING and does NOT touch inventory — only confirmPaystackPayment
 * does that, after the caller has verified the charge with Paystack directly.
 */
export async function createPendingPosMomoOrder(
  context: CommerceContext,
  actor: CommerceActor,
  input: Omit<CreateOrderDraftInput, "channel"> & { posShiftId: string }
) {
  await assertCan(context, actor, "pos.sell");
  const parsed = createOrderDraftInputSchema.parse({
    ...input,
    channel: "POS",
    staffId: input.staffId ?? actor.uid
  });

  const shift = await context.repo.getPosShift(parsed.posShiftId ?? "");
  if (!shift || shift.status !== "OPEN") {
    throw new CommerceError("INVALID_STATE", "POS sale requires an open shift.");
  }

  return withTransaction(context, async () => {
    const existingOrder = await context.repo.findOrderByIdempotencyKey(parsed.idempotencyKey);
    if (existingOrder) {
      const existingPayment = (await context.repo.listPayments()).find(
        (payment) => payment.orderId === existingOrder.id
      );
      return { order: existingOrder, payment: existingPayment ?? null, idempotent: true };
    }

    const order = await buildOrder(context, parsed, {
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING"
    });

    const payment: Payment = {
      id: createId(context, "payment"),
      orderId: order.id,
      provider: "PAYSTACK",
      method: "mobile_money",
      status: "PENDING",
      amount: order.total,
      currency: order.currency,
      providerReference: null,
      idempotencyKey: parsed.idempotencyKey,
      createdAt: getNow(context),
      updatedAt: getNow(context)
    };

    await context.repo.saveOrder(order);
    await context.repo.savePayment(payment);
    await writeAuditLog(context, actor, {
      action: "orders.create_pending_payment",
      entityType: "order",
      entityId: order.id,
      summary: `Created pending POS mobile money order ${order.orderNumber}`
    });

    return { order, payment, idempotent: false };
  });
}

/** Cancels an unconfirmed POS mobile money charge (staff cancel or client-side timeout). */
export async function cancelPendingPosMomoSale(
  context: CommerceContext,
  actor: CommerceActor,
  input: { orderId: string }
) {
  await assertCan(context, actor, "pos.sell");
  return withTransaction(context, async () => {
    const order = await context.repo.getOrder(input.orderId);
    if (!order || order.channel !== "POS") {
      throw new CommerceError("NOT_FOUND", "POS order not found.");
    }

    if (order.paymentStatus === "PAID") {
      // Already confirmed (e.g. the webhook won the race) — nothing to cancel.
      return { order, idempotent: true };
    }

    if (order.status === "CANCELLED") {
      return { order, idempotent: true };
    }

    const updatedOrder: Order = { ...order, status: "CANCELLED" };
    await context.repo.saveOrder(updatedOrder);

    const payments = await context.repo.listPayments();
    const payment = payments.find((entry) => entry.orderId === order.id);
    if (payment) {
      await context.repo.savePayment({ ...payment, status: "FAILED", updatedAt: getNow(context) });
    }

    await writeAuditLog(context, actor, {
      action: "pos.momo_charge_cancelled",
      entityType: "order",
      entityId: order.id,
      summary: `Cancelled pending mobile money charge for ${order.orderNumber}`
    });

    return { order: updatedOrder, idempotent: false };
  });
}

export async function completeOnlineOrder(context: CommerceContext, input: CompleteSaleInput) {
  const parsed = completeSaleInputSchema.parse({
    ...input,
    channel: "ONLINE",
    staffId: null,
    posShiftId: null
  });

  return completeSale(context, systemActor("online-checkout"), parsed);
}

/**
 * Starts an online order awaiting Paystack confirmation. Unlike completeSale,
 * this does NOT mark the order paid and does NOT touch inventory — those only
 * happen once confirmPaystackPayment verifies the transaction succeeded.
 */
export async function createPendingOnlineOrder(
  context: CommerceContext,
  input: Omit<CreateOrderDraftInput, "channel"> & { paymentMethod: CompleteSaleInput["paymentMethod"] }
) {
  const parsed = createOrderDraftInputSchema.parse({ ...input, channel: "ONLINE" });
  const actor = systemActor("online-checkout-paystack");

  return withTransaction(context, async () => {
    const existingOrder = await context.repo.findOrderByIdempotencyKey(parsed.idempotencyKey);
    if (existingOrder) {
      const existingPayment = (await context.repo.listPayments()).find(
        (payment) => payment.orderId === existingOrder.id
      );
      return { order: existingOrder, payment: existingPayment ?? null, idempotent: true };
    }

    const order = await buildOrder(context, parsed, {
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING"
    });

    const payment: Payment = {
      id: createId(context, "payment"),
      orderId: order.id,
      provider: "PAYSTACK",
      method: input.paymentMethod,
      status: "PENDING",
      amount: order.total,
      currency: order.currency,
      providerReference: null,
      idempotencyKey: parsed.idempotencyKey,
      createdAt: getNow(context),
      updatedAt: getNow(context)
    };

    await context.repo.saveOrder(order);
    await context.repo.savePayment(payment);
    await writeAuditLog(context, actor, {
      action: "orders.create_pending_payment",
      entityType: "order",
      entityId: order.id,
      summary: `Created pending Paystack order ${order.orderNumber}`
    });

    return { order, payment, idempotent: false };
  });
}

/**
 * Confirms a Paystack-verified payment: flips the order/payment to PAID and
 * commits inventory. The caller (webhook handler / callback page) is
 * responsible for having already verified the transaction directly with
 * Paystack's API — this function trusts that verification happened and just
 * records the confirmed state. Safe to call more than once for the same
 * order (idempotent no-op if already PAID).
 */
export async function confirmPaystackPayment(
  context: CommerceContext,
  input: { orderId: string; providerReference: string }
) {
  const actor = systemActor("paystack-webhook");

  const result = await withTransaction(context, async () => {
    const order = await context.repo.getOrder(input.orderId);
    if (!order) {
      throw new CommerceError("NOT_FOUND", `Order not found: ${input.orderId}`);
    }

    const payments = await context.repo.listPayments();
    const payment = payments.find((entry) => entry.orderId === order.id);
    if (!payment) {
      throw new CommerceError("NOT_FOUND", `No payment record for order: ${order.id}`);
    }

    if (order.paymentStatus === "PAID") {
      return { order, payment, inventoryMovements: [], alreadyConfirmed: true };
    }

    const updatedOrder: Order = { ...order, status: "PAID", paymentStatus: "PAID" };
    // allowOversell: the customer's money has already moved at Paystack by
    // this point — refusing to confirm the order over a stock shortfall
    // doesn't protect anything, it just leaves a paid customer with no
    // order and the store with no record a payment came in. Let stock go
    // negative as a visible oversold signal instead of blocking here.
    const movements = await decrementInventoryForOrder(context, actor, updatedOrder, {
      allowOversell: true
    });
    const updatedPayment: Payment = {
      ...payment,
      status: "PAID",
      providerReference: input.providerReference,
      updatedAt: getNow(context)
    };

    await context.repo.saveOrder(updatedOrder);
    await context.repo.savePayment(updatedPayment);
    await writeAuditLog(context, actor, {
      action: "orders.confirm_paystack_payment",
      entityType: "order",
      entityId: order.id,
      summary: `Confirmed Paystack payment for ${order.orderNumber}`
    });

    return { order: updatedOrder, payment: updatedPayment, inventoryMovements: movements, alreadyConfirmed: false };
  });

  if (!result.alreadyConfirmed) {
    void notifyOrderEvent(result.order, "CONFIRMED");
    void notifyAdminOfNewOrder(result.order);
    if (result.order.promotionId) {
      void redeemPromotion(context, result.order.promotionId);
    }
  }

  return result;
}

export async function completeAdminCreatedSale(
  context: CommerceContext,
  actor: CommerceActor,
  input: CompleteSaleInput
) {
  await assertCan(context, actor, "orders.update_status");
  const parsed = completeSaleInputSchema.parse({
    ...input,
    channel: "ADMIN_CREATED"
  });

  return completeSale(context, actor, parsed);
}

/**
 * Refunds a completed POS sale: returns items to stock, marks the order/payment
 * refunded, and requires manager approval when the actor's role-based refund
 * limit doesn't cover the order total (ADR-013). `approverActor` must already
 * be verified by the caller (e.g. a freshly checked manager ID token) — this
 * function only checks that the approver's own role grants enough headroom.
 */
export async function refundPosSale(
  context: CommerceContext,
  actor: CommerceActor,
  input: PosReversalInput,
  approverActor?: CommerceActor
) {
  return reversePosSale(context, actor, input, approverActor, "REFUND");
}

/**
 * Voids a completed POS sale: same reversal as a refund, but the order is
 * marked CANCELLED rather than REFUNDED (the sale never should have counted).
 * Subject to the same manager-approval rule as refunds.
 */
export async function voidPosSale(
  context: CommerceContext,
  actor: CommerceActor,
  input: PosReversalInput,
  approverActor?: CommerceActor
) {
  return reversePosSale(context, actor, input, approverActor, "VOID");
}

async function reversePosSale(
  context: CommerceContext,
  actor: CommerceActor,
  input: PosReversalInput,
  approverActor: CommerceActor | undefined,
  mode: "REFUND" | "VOID"
) {
  const permission = mode === "REFUND" ? "pos.refund" : "pos.void";
  await assertCan(context, actor, permission);
  const parsed = posReversalInputSchema.parse(input);

  return withTransaction(context, async () => {
    const order = await context.repo.getOrder(parsed.orderId);
    if (!order) {
      throw new CommerceError("NOT_FOUND", `Order not found: ${parsed.orderId}`);
    }

    if (order.channel !== "POS") {
      throw new CommerceError("INVALID_STATE", "Only POS sales can be refunded or voided here.");
    }

    if (order.paymentStatus === "REFUNDED") {
      return { order, idempotent: true };
    }

    if (order.paymentStatus !== "PAID") {
      throw new CommerceError("INVALID_STATE", "Only a paid sale can be refunded or voided.");
    }

    await requireReversalAuthorization(context, actor, approverActor, permission, order.total);

    const movements: InventoryMovement[] = [];
    for (const item of order.items) {
      const variant = await context.repo.getVariant(item.productId, item.variantId);
      if (!variant) {
        continue;
      }

      const updatedVariant: ProductVariant = parsed.restock
        ? {
            ...variant,
            stockOnHand: variant.stockOnHand + item.quantity,
            stockAvailable: variant.stockAvailable + item.quantity
          }
        : variant;

      const movement: InventoryMovement = {
        id: createId(context, "movement"),
        productId: item.productId,
        variantId: item.variantId,
        type: parsed.restock ? "RETURN_TO_STOCK" : "REFUND_NO_STOCK_RETURN",
        quantityDelta: parsed.restock ? item.quantity : 0,
        stockAfter: updatedVariant.stockAvailable,
        orderId: order.id,
        reason: parsed.reason,
        actorId: actor.uid,
        channel: order.channel,
        createdAt: getNow(context)
      };

      if (parsed.restock) {
        await context.repo.saveVariant(updatedVariant);
      }
      await context.repo.saveInventoryMovement(movement);
      movements.push(movement);
    }

    const updatedOrder: Order = {
      ...order,
      status: mode === "REFUND" ? "REFUNDED" : "CANCELLED",
      paymentStatus: "REFUNDED",
      fulfilmentStatus: mode === "VOID" ? "CANCELLED" : order.fulfilmentStatus
    };
    await context.repo.saveOrder(updatedOrder);

    const payments = await context.repo.listPayments();
    const payment = payments.find((entry) => entry.orderId === order.id);
    let updatedPayment: Payment | null = null;
    if (payment) {
      updatedPayment = { ...payment, status: "REFUNDED", updatedAt: getNow(context) };
      await context.repo.savePayment(updatedPayment);
    }

    await writeAuditLog(context, actor, {
      action: mode === "REFUND" ? "pos.refund" : "pos.void",
      entityType: "order",
      entityId: order.id,
      summary: `${mode === "REFUND" ? "Refunded" : "Voided"} ${order.orderNumber}`,
      reason: approverActor ? `${parsed.reason} — approved by ${approverActor.uid}` : parsed.reason
    });

    return { order: updatedOrder, payment: updatedPayment, inventoryMovements: movements, idempotent: false };
  });
}

async function requireReversalAuthorization(
  context: CommerceContext,
  actor: CommerceActor,
  approverActor: CommerceActor | undefined,
  permission: Permission,
  amount: number
) {
  const roles = await getEffectiveRoles(context, actor.roleIds);
  const actorLimit = getHighestRoleLimit(roles, actor, "maxRefundAmount");
  if (amount <= actorLimit) {
    return;
  }

  if (!approverActor) {
    throw new CommerceError(
      "FORBIDDEN",
      "This amount is over your refund limit. A manager must approve it."
    );
  }

  const approverRoles = await getEffectiveRoles(context, approverActor.roleIds);
  if (!hasPermission(approverRoles, approverActor, permission)) {
    throw new CommerceError("FORBIDDEN", "The approving account cannot authorize this action.");
  }

  const approverLimit = getHighestRoleLimit(approverRoles, approverActor, "maxRefundAmount");
  if (amount > approverLimit) {
    throw new CommerceError("FORBIDDEN", "The approving account's refund limit is too low for this amount.");
  }
}

export async function updateOrderFulfilment(
  context: CommerceContext,
  actor: CommerceActor,
  input: UpdateOrderFulfilmentInput
) {
  await assertCan(context, actor, "fulfilment.update");
  const parsed = updateOrderFulfilmentInputSchema.parse(input);
  const order = await context.repo.getOrder(parsed.id);
  if (!order) {
    throw new CommerceError("NOT_FOUND", `Order not found: ${parsed.id}`);
  }

  const statusChanged = order.fulfilmentStatus !== parsed.fulfilmentStatus;
  const updatedOrder: Order = { ...order, fulfilmentStatus: parsed.fulfilmentStatus };

  await context.repo.saveOrder(updatedOrder);
  await writeAuditLog(context, actor, {
    action: "orders.update_fulfilment",
    entityType: "order",
    entityId: order.id,
    summary: `Set ${order.orderNumber} fulfilment to ${parsed.fulfilmentStatus}`
  });

  if (statusChanged && parsed.fulfilmentStatus === "READY_FOR_PICKUP") {
    void notifyOrderEvent(updatedOrder, "READY_FOR_PICKUP");
  } else if (statusChanged && parsed.fulfilmentStatus === "OUT_FOR_DELIVERY") {
    void notifyOrderEvent(updatedOrder, "OUT_FOR_DELIVERY");
  }

  return updatedOrder;
}

/** Order/receipt lookup for POS — find a past sale by order number, customer name, or phone. */
export async function searchOrders(context: CommerceContext, actor: CommerceActor, query: string) {
  await assertCan(context, actor, "pos.receipts.view");
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const orders = await context.repo.listOrders();
  return orders
    .filter((order) => {
      const haystack = [order.orderNumber, order.customerSnapshot?.name, order.customerSnapshot?.phone]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    })
    .slice(0, 15);
}

/**
 * Public order tracking — no actor, no permission check, because customers
 * aren't authenticated. Safety comes from requiring both the order number
 * AND the phone on file to match, so knowing (or guessing) an order number
 * alone can't leak another customer's order details.
 */
/**
 * Looks up an order by order number alone. The order number is the
 * capability: it's a random ~41-bit token (see createOrderNumber) that only
 * reaches the customer via a private channel (their own SMS, or the printed
 * POS receipt), so knowing it is treated as proof of ownership — the same
 * trust model most courier tracking numbers use. There is deliberately no
 * rate limiting yet; see SECURITY.md for the current stance on that gap.
 */
export async function trackOrder(context: CommerceContext, orderNumber: string) {
  const normalizedOrderNumber = orderNumber.trim().toUpperCase();
  if (!normalizedOrderNumber) {
    return null;
  }

  const orders = await context.repo.listOrders();
  const order = orders.find((entry) => entry.orderNumber.toUpperCase() === normalizedOrderNumber);

  return order ?? null;
}

export async function writeAuditLog(
  context: CommerceContext,
  actor: CommerceActor,
  input: Omit<AuditLog, "id" | "actorId" | "createdAt">
) {
  const log: AuditLog = {
    ...input,
    id: createId(context, "audit"),
    actorId: actor.uid,
    createdAt: getNow(context)
  };

  await context.repo.saveAuditLog(log);
  return log;
}

async function completeSale(
  context: CommerceContext,
  actor: CommerceActor,
  input: ParsedCompleteSaleInput
): Promise<CompletedSale> {
  const parsed = completeSaleInputSchema.parse(input);

  const result = await withTransaction(context, async () => {
    const existingOrder = await context.repo.findOrderByIdempotencyKey(parsed.idempotencyKey);
    if (existingOrder) {
      return {
        order: existingOrder,
        payment: null,
        inventoryMovements: [],
        idempotent: true
      };
    }

    const order = await buildOrder(context, parsed, {
      status: "PAID",
      paymentStatus: "PAID"
    });

    if (parsed.paymentMethod === "cash" && (parsed.amountReceived ?? order.total) < order.total) {
      throw new CommerceError("INVALID_STATE", "Cash received is less than order total.");
    }

    const movements = await decrementInventoryForOrder(context, actor, order);
    const payment: Payment = {
      id: createId(context, "payment"),
      orderId: order.id,
      provider: parsed.paymentProvider,
      method: parsed.paymentMethod,
      status: "PAID",
      amount: order.total,
      currency: order.currency,
      providerReference: parsed.paymentReference ?? null,
      idempotencyKey: parsed.idempotencyKey,
      createdAt: getNow(context),
      updatedAt: getNow(context)
    };

    await context.repo.saveOrder(order);
    await context.repo.savePayment(payment);
    await writeAuditLog(context, actor, {
      action: "orders.complete_sale",
      entityType: "order",
      entityId: order.id,
      summary: `Completed ${order.channel} sale`
    });

    return {
      order,
      payment,
      inventoryMovements: movements,
      idempotent: false
    };
  });

  if (!result.idempotent) {
    void notifyOrderEvent(result.order, "CONFIRMED");
    void notifyAdminOfNewOrder(result.order);
    if (result.order.promotionId) {
      void redeemPromotion(context, result.order.promotionId);
    }
  }

  return result;
}

async function buildOrder(
  context: CommerceContext,
  input: ParsedCreateOrderDraftInput,
  state: Pick<Order, "status" | "paymentStatus">
): Promise<Order> {
  const items = await buildOrderItems(context, input.items);
  const subtotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  const discountTotal = items.reduce((total, item) => total + item.discountTotal, 0);
  const total = subtotal - discountTotal + input.deliveryTotal + input.taxTotal;

  if (total < 0) {
    throw new CommerceError("VALIDATION_ERROR", "Order total cannot be negative.");
  }

  return {
    id: createId(context, "order"),
    orderNumber: createOrderNumber(context),
    channel: input.channel,
    status: state.status,
    paymentStatus: state.paymentStatus,
    fulfilmentStatus: "UNFULFILLED",
    customerId: input.customerId ?? null,
    customerSnapshot: input.customerSnapshot ?? null,
    items,
    subtotal,
    discountTotal,
    deliveryTotal: input.deliveryTotal,
    taxTotal: input.taxTotal,
    total,
    currency: "GHS",
    createdBy: input.createdBy ?? null,
    staffId: input.staffId ?? null,
    posShiftId: input.posShiftId ?? null,
    idempotencyKey: input.idempotencyKey,
    createdAt: getNow(context),
    promotionId: input.promotionId ?? null,
    promoCode: input.promoCode ?? null
  };
}

async function buildOrderItems(
  context: CommerceContext,
  items: ParsedCreateOrderDraftInput["items"]
): Promise<OrderItem[]> {
  const result: OrderItem[] = [];
  // Resolved and snapshotted onto the order at creation time — same reason
  // productTitle/variantTitle/sku are snapshots rather than live joins: a
  // later product edit, media swap, or deletion must not change what a past
  // order shows.
  const media = await context.repo.listMedia();
  const mediaById = new Map(media.map((asset) => [asset.id, asset]));

  for (const item of items) {
    const product = await requiredProduct(context, item.productId);
    const variant = await requiredVariant(context, item.productId, item.variantId);
    const grossLineTotal = variant.price * item.quantity;

    if (item.discountTotal > grossLineTotal) {
      throw new CommerceError("VALIDATION_ERROR", "Line discount cannot exceed line total.");
    }

    const mediaId = (variant.mediaIds ?? [])[0] ?? (product.mediaIds ?? [])[0];
    const mediaUrl = mediaId ? mediaById.get(mediaId)?.url : undefined;

    result.push({
      productId: product.id,
      variantId: variant.id,
      productTitle: product.title,
      variantTitle: variant.title,
      sku: variant.sku,
      quantity: item.quantity,
      unitPrice: variant.price,
      discountTotal: item.discountTotal,
      lineTotal: grossLineTotal - item.discountTotal,
      mediaUrl
    });
  }

  return result;
}

async function decrementInventoryForOrder(
  context: CommerceContext,
  actor: CommerceActor,
  order: Order,
  options: { allowOversell?: boolean } = {}
) {
  const movements: InventoryMovement[] = [];

  for (const item of order.items) {
    const variant = await requiredVariant(context, item.productId, item.variantId);

    if (!variant.trackInventory) {
      continue;
    }

    const insufficientStock = variant.stockAvailable < item.quantity || variant.stockOnHand < item.quantity;
    if (insufficientStock && !options.allowOversell) {
      throw new CommerceError("OUT_OF_STOCK", `${variant.sku} does not have enough stock.`);
    }

    const stockOnHand = variant.stockOnHand - item.quantity;
    const stockAvailable = variant.stockAvailable - item.quantity;
    const updatedVariant: ProductVariant = {
      ...variant,
      stockOnHand,
      stockAvailable
    };
    const movement: InventoryMovement = {
      id: createId(context, "movement"),
      productId: item.productId,
      variantId: item.variantId,
      type: movementTypeForChannel(order.channel),
      quantityDelta: item.quantity * -1,
      stockAfter: stockAvailable,
      orderId: order.id,
      reason: `${order.channel} sale`,
      actorId: actor.uid,
      channel: order.channel,
      createdAt: getNow(context)
    };

    await context.repo.saveVariant(updatedVariant);
    await context.repo.saveInventoryMovement(movement);
    movements.push(movement);
  }

  return movements;
}

async function assertCan(context: CommerceContext, actor: CommerceActor, permission: Permission) {
  if (actor.system) {
    return;
  }

  const roles = await getEffectiveRoles(context, actor.roleIds);
  if (!hasPermission(roles, actor, permission)) {
    throw new CommerceError("FORBIDDEN", `Missing permission: ${permission}`);
  }
}

/**
 * Resolves role ids to full Role objects: the three built-in roles resolve
 * instantly with no Firestore read, and any other id (a custom role) is
 * looked up live via context.repo.getRole(). Every permission check in the
 * app should go through this rather than the static `defaultRoles` array
 * directly, or a custom role silently grants nothing.
 */
export async function getEffectiveRoles(context: CommerceContext, roleIds: string[]) {
  const roleMap = new Map<string, Role>();

  for (const role of [...defaultRoles, ...(context.roles ?? [])]) {
    roleMap.set(role.id, role);
  }

  for (const roleId of roleIds) {
    if (!roleMap.has(roleId)) {
      const role = await context.repo.getRole(roleId);
      if (role) {
        roleMap.set(role.id, role);
      }
    }
  }

  return [...roleMap.values()];
}

async function requiredProduct(context: CommerceContext, id: string) {
  const product = await context.repo.getProduct(id);
  if (!product) {
    throw new CommerceError("NOT_FOUND", `Product not found: ${id}`);
  }

  return product;
}

async function requiredVariant(context: CommerceContext, productId: string, variantId: string) {
  const variant = await context.repo.getVariant(productId, variantId);
  if (!variant) {
    throw new CommerceError("NOT_FOUND", `Variant not found: ${variantId}`);
  }

  if (!variant.active) {
    throw new CommerceError("INVALID_STATE", `Variant is not active: ${variantId}`);
  }

  return variant;
}

function requiredEntity<T extends { id: string }>(entities: T[], id: string, label: string) {
  const entity = entities.find((item) => item.id === id);
  if (!entity) {
    throw new CommerceError("NOT_FOUND", `${label} not found: ${id}`);
  }

  return entity;
}

function movementTypeForChannel(channel: SalesChannel): InventoryMovementType {
  if (channel === "POS") {
    return "POS_SALE";
  }

  if (channel === "ADMIN_CREATED") {
    return "ADMIN_CREATED_SALE";
  }

  return "ONLINE_SALE";
}

function systemActor(source: string): CommerceActor {
  return {
    uid: `system:${source}`,
    roleIds: [],
    system: true
  };
}

function getNow(context: CommerceContext) {
  return context.now?.() ?? new Date();
}

function createOrderNumber(context: CommerceContext) {
  return createId(context, "OMK").toUpperCase();
}

function createId(context: CommerceContext, prefix: string) {
  return context.id?.(prefix) ?? `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createSlugId(prefix: string, value: string) {
  return `${prefix}-${value.replace(/[^a-z0-9-]/g, "-")}`;
}

async function uniqueRoleId(context: CommerceContext, name: string) {
  const base = createSlugId("role", name.toLowerCase().replaceAll(" ", "-"));
  let candidate = base;
  let suffix = 2;
  while (await context.repo.getRole(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function parseMoneyMinorUnit(value: unknown, key: string) {
  if (value === undefined) {
    return 0;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new CommerceError("VALIDATION_ERROR", `${key} must be a positive amount.`);
  }

  return value;
}

function withTransaction<T>(context: CommerceContext, operation: () => Promise<T>) {
  return (context.transaction ?? createNoopTransaction())(operation);
}
