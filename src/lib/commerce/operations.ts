import { defaultRoles, hasPermission, type Permission, type Role, type UserAccess } from "@/lib/permissions/permissions";
import { CommerceError } from "@/lib/commerce/errors";
import type { CommerceRepository, CommerceTransaction } from "@/lib/commerce/repository";
import { createNoopTransaction } from "@/lib/commerce/repository";
import {
  adjustInventoryInputSchema,
  completeSaleInputSchema,
  createCustomerInputSchema,
  createDeliveryRuleInputSchema,
  createOrderDraftInputSchema,
  createProductInputSchema,
  createPromotionInputSchema,
  createVariantInputSchema,
  updateProductInputSchema,
  updateVariantInputSchema,
  type AdjustInventoryInput,
  type CompleteSaleInput,
  type CreateCustomerInput,
  type CreateOrderDraftInput,
  type CreateProductInput,
  type CreateVariantInput,
  type ParsedCompleteSaleInput,
  type ParsedCreateOrderDraftInput,
  type UpdateProductInput,
  type UpdateVariantInput
} from "@/lib/commerce/schemas";
import type {
  AuditLog,
  Customer,
  DeliveryRule,
  InventoryMovement,
  InventoryMovementType,
  Order,
  OrderItem,
  Payment,
  Product,
  ProductVariant,
  Promotion,
  SalesChannel
} from "@/lib/commerce/types";

export type CommerceActor = UserAccess & {
  system?: boolean;
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

export async function completeOnlineOrder(context: CommerceContext, input: CompleteSaleInput) {
  const parsed = completeSaleInputSchema.parse({
    ...input,
    channel: "ONLINE",
    staffId: null,
    posShiftId: null
  });

  return completeSale(context, systemActor("online-checkout"), parsed);
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

  return withTransaction(context, async () => {
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
    idempotencyKey: input.idempotencyKey
  };
}

async function buildOrderItems(
  context: CommerceContext,
  items: ParsedCreateOrderDraftInput["items"]
): Promise<OrderItem[]> {
  const result: OrderItem[] = [];

  for (const item of items) {
    const product = await requiredProduct(context, item.productId);
    const variant = await requiredVariant(context, item.productId, item.variantId);
    const grossLineTotal = variant.price * item.quantity;

    if (item.discountTotal > grossLineTotal) {
      throw new CommerceError("VALIDATION_ERROR", "Line discount cannot exceed line total.");
    }

    result.push({
      productId: product.id,
      variantId: variant.id,
      productTitle: product.title,
      variantTitle: variant.title,
      sku: variant.sku,
      quantity: item.quantity,
      unitPrice: variant.price,
      discountTotal: item.discountTotal,
      lineTotal: grossLineTotal - item.discountTotal
    });
  }

  return result;
}

async function decrementInventoryForOrder(
  context: CommerceContext,
  actor: CommerceActor,
  order: Order
) {
  const movements: InventoryMovement[] = [];

  for (const item of order.items) {
    const variant = await requiredVariant(context, item.productId, item.variantId);

    if (!variant.trackInventory) {
      continue;
    }

    if (variant.stockAvailable < item.quantity || variant.stockOnHand < item.quantity) {
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

  const roles = await resolveRoles(context, actor.roleIds);
  if (!hasPermission(roles, actor, permission)) {
    throw new CommerceError("FORBIDDEN", `Missing permission: ${permission}`);
  }
}

async function resolveRoles(context: CommerceContext, roleIds: string[]) {
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

function withTransaction<T>(context: CommerceContext, operation: () => Promise<T>) {
  return (context.transaction ?? createNoopTransaction())(operation);
}
