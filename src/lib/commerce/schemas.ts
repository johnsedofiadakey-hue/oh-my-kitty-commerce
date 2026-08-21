import { z } from "zod";
import { permissions } from "@/lib/permissions/permissions";

const slugSchema = z
  .string()
  .min(2)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase URL-safe slugs.");

const moneySchema = z.number().int().min(0);
const nonZeroQuantitySchema = z.number().int().refine((value) => value !== 0, {
  message: "Quantity delta cannot be zero."
});

export const salesChannelSchema = z.enum(["ONLINE", "POS", "ADMIN_CREATED"]);
export const productStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);
export const paymentMethodSchema = z.enum([
  "cash",
  "mobile_money",
  "card",
  "manual_transfer",
  "other"
]);

export const seoSchema = z.object({
  title: z.string().max(70).optional(),
  description: z.string().max(170).optional()
});

export const productCareSchema = z.object({
  usage: z.string().optional(),
  ingredients: z.string().optional(),
  warnings: z.string().optional()
});

/**
 * Fields shared by create and update — deliberately WITHOUT `.default()`.
 * Zod applies `.default()` to a field that's simply absent from the input,
 * even through `.partial()` — so an update schema built by calling
 * `.partial()` directly on a schema with defaults doesn't make those fields
 * "leave unchanged if omitted", it makes them "silently reset to the
 * default if omitted". `createProductInputSchema` layers defaults back on
 * for creation; `updateProductInputSchema` partials these bare fields, so
 * an update that only mentions `status` really does leave everything else
 * untouched.
 */
const productFieldsSchema = z.object({
  title: z.string().min(2),
  slug: slugSchema,
  shortCopy: z.string().max(140).optional(),
  description: z.string().optional(),
  status: productStatusSchema,
  categoryIds: z.array(z.string().min(1)),
  collectionIds: z.array(z.string().min(1)),
  concernIds: z.array(z.string().min(1)),
  productTypeIds: z.array(z.string().min(1)),
  routineIds: z.array(z.string().min(1)),
  tags: z.array(z.string().min(1)),
  mediaIds: z.array(z.string().min(1)),
  featured: z.boolean(),
  bestSeller: z.boolean(),
  homepagePriority: z.number().int().min(0).optional(),
  seo: seoSchema.optional(),
  care: productCareSchema.optional()
});

export const createProductInputSchema = productFieldsSchema.extend({
  status: productStatusSchema.default("DRAFT"),
  categoryIds: z.array(z.string().min(1)).default([]),
  collectionIds: z.array(z.string().min(1)).default([]),
  concernIds: z.array(z.string().min(1)).default([]),
  productTypeIds: z.array(z.string().min(1)).default([]),
  routineIds: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
  mediaIds: z.array(z.string().min(1)).default([]),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false)
});

export const updateProductInputSchema = productFieldsSchema.partial().extend({
  id: z.string().min(1)
});

const variantFieldsSchema = z.object({
  productId: z.string().min(1),
  title: z.string().min(1),
  sku: z.string().min(2),
  barcode: z.string().optional(),
  optionValues: z.record(z.string(), z.string()),
  price: moneySchema,
  currency: z.literal("GHS"),
  compareAtPrice: moneySchema.nullable().optional(),
  cost: moneySchema.nullable().optional(),
  mediaIds: z.array(z.string().min(1)),
  trackInventory: z.boolean(),
  stockOnHand: z.number().int().min(0),
  stockAvailable: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0),
  active: z.boolean()
});

export const createVariantInputSchema = variantFieldsSchema.extend({
  optionValues: z.record(z.string(), z.string()).default({}),
  currency: z.literal("GHS").default("GHS"),
  mediaIds: z.array(z.string().min(1)).default([]),
  trackInventory: z.boolean().default(true),
  stockOnHand: z.number().int().min(0).default(0),
  stockAvailable: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  active: z.boolean().default(true)
});

export const updateVariantInputSchema = variantFieldsSchema.partial().extend({
  productId: z.string().min(1),
  id: z.string().min(1)
});

export const orderItemInputSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().min(1),
  discountTotal: moneySchema.default(0)
});

export const customerSnapshotSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export const createOrderDraftInputSchema = z.object({
  channel: salesChannelSchema,
  customerId: z.string().nullable().optional(),
  customerSnapshot: customerSnapshotSchema.nullable().optional(),
  items: z.array(orderItemInputSchema).min(1),
  deliveryTotal: moneySchema.default(0),
  taxTotal: moneySchema.default(0),
  createdBy: z.string().nullable().optional(),
  staffId: z.string().nullable().optional(),
  posShiftId: z.string().nullable().optional(),
  idempotencyKey: z.string().min(8),
  promotionId: z.string().nullable().optional(),
  promoCode: z.string().nullable().optional()
});

export const completeSaleInputSchema = createOrderDraftInputSchema.extend({
  paymentMethod: paymentMethodSchema,
  paymentProvider: z.enum(["CASH", "MANUAL", "PAYSTACK", "TBD"]).default("TBD"),
  amountReceived: moneySchema.optional(),
  paymentReference: z.string().nullable().optional()
});

export const adjustInventoryInputSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  type: z.enum(["STOCK_RECEIVED", "DAMAGE", "LOSS", "MANUAL_ADJUSTMENT"]),
  quantityDelta: nonZeroQuantitySchema,
  reason: z.string().min(3)
});

export const createMediaAssetInputSchema = z.object({
  storagePath: z.string().min(1),
  url: z.string().min(1),
  alt: z.string().min(1),
  title: z.string().optional(),
  usage: z.array(z.string()).default([])
});

export const attachProductImageInputSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  storagePath: z.string().min(1),
  url: z.string().min(1),
  alt: z.string().min(1)
});

export const createCustomerInputSchema = z.object({
  authUid: z.string().nullable().optional(),
  name: z.string().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  createdFrom: salesChannelSchema
});

export const updateCustomerInputSchema = createCustomerInputSchema
  .omit({ createdFrom: true })
  .partial()
  .extend({
    id: z.string().min(1)
  });

const promotionFieldsSchema = z.object({
  code: z.string().min(2).transform((value) => value.toUpperCase()),
  type: z.enum(["PERCENT", "AMOUNT"]),
  value: z.number().positive(),
  active: z.boolean(),
  channelRestrictions: z.array(salesChannelSchema),
  productRestrictions: z.array(z.string()),
  categoryRestrictions: z.array(z.string()),
  usageLimit: z.number().int().positive().nullable().optional(),
  requiresManagerApproval: z.boolean()
});

export const createPromotionInputSchema = promotionFieldsSchema.extend({
  active: z.boolean().default(true),
  channelRestrictions: z.array(salesChannelSchema).default([]),
  productRestrictions: z.array(z.string()).default([]),
  categoryRestrictions: z.array(z.string()).default([]),
  requiresManagerApproval: z.boolean().default(false)
});

export const updatePromotionInputSchema = promotionFieldsSchema
  .omit({ code: true })
  .partial()
  .extend({
    id: z.string().min(1)
  });

export const posReversalInputSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(3),
  restock: z.boolean().default(true)
});

export const updateOrderFulfilmentInputSchema = z.object({
  id: z.string().min(1),
  fulfilmentStatus: z.enum([
    "UNFULFILLED",
    "PROCESSING",
    "READY_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "FULFILLED",
    "CANCELLED"
  ])
});

const taxonomyEntryFieldsSchema = z.object({
  title: z.string().min(2),
  slug: slugSchema,
  description: z.string().optional(),
  sortOrder: z.number().int().min(0),
  active: z.boolean()
});

const taxonomyEntryDefaults = { sortOrder: z.number().int().min(0).default(0), active: z.boolean().default(true) };

export const createConcernInputSchema = taxonomyEntryFieldsSchema.extend(taxonomyEntryDefaults);

export const updateConcernInputSchema = taxonomyEntryFieldsSchema.partial().extend({
  id: z.string().min(1)
});

export const createProductTypeInputSchema = taxonomyEntryFieldsSchema.extend(taxonomyEntryDefaults);

export const updateProductTypeInputSchema = taxonomyEntryFieldsSchema.partial().extend({
  id: z.string().min(1)
});

export const createRoutineInputSchema = taxonomyEntryFieldsSchema.extend(taxonomyEntryDefaults);

export const updateRoutineInputSchema = taxonomyEntryFieldsSchema.partial().extend({
  id: z.string().min(1)
});

export const createCategoryInputSchema = taxonomyEntryFieldsSchema.extend(taxonomyEntryDefaults);

export const updateCategoryInputSchema = taxonomyEntryFieldsSchema.partial().extend({
  id: z.string().min(1)
});

export const attachCategoryImageInputSchema = z.object({
  categoryId: z.string().min(1),
  storagePath: z.string().min(1),
  url: z.string().min(1),
  alt: z.string().min(1)
});

const deliveryRuleFieldsSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["PICKUP", "LOCAL_DELIVERY", "NATIONWIDE_DELIVERY"]),
  active: z.boolean(),
  regions: z.array(z.string()),
  fee: moneySchema,
  freeAbove: moneySchema.nullable().optional(),
  estimate: z.string().optional(),
  sortOrder: z.number().int().min(0)
});

export const createDeliveryRuleInputSchema = deliveryRuleFieldsSchema.extend({
  active: z.boolean().default(true),
  regions: z.array(z.string()).default([]),
  fee: moneySchema.default(0),
  sortOrder: z.number().int().min(0).default(0)
});

export const updateDeliveryRuleInputSchema = deliveryRuleFieldsSchema.partial().extend({
  id: z.string().min(1)
});

const staffUserFieldsSchema = z.object({
  id: z.string().min(1),
  uid: z.string().min(1),
  displayName: z.string().min(2),
  email: z.string().email(),
  status: z.enum(["ACTIVE", "DEACTIVATED"]),
  roleIds: z.array(z.string().min(1)).min(1, "Choose at least one role."),
  type: z.literal("ADMIN_OR_STAFF"),
  posEnabled: z.boolean(),
  permissionOverrides: z.array(z.string())
});

export const createStaffUserInputSchema = staffUserFieldsSchema.extend({
  status: z.enum(["ACTIVE", "DEACTIVATED"]).default("ACTIVE"),
  type: z.literal("ADMIN_OR_STAFF").default("ADMIN_OR_STAFF"),
  posEnabled: z.boolean().default(false),
  permissionOverrides: z.array(z.string()).default([])
});

export const updateStaffUserInputSchema = staffUserFieldsSchema
  .omit({ uid: true, type: true })
  .partial()
  .extend({
    id: z.string().min(1)
  });

const roleLimitsSchema = z.object({
  maxDiscountPercent: z.number().min(0).max(100).optional(),
  maxRefundAmount: z.number().int().min(0).optional(),
  canOverridePrice: z.boolean().optional()
});

const roleFieldsSchema = z.object({
  name: z.string().min(2),
  permissions: z.array(z.enum(permissions)).min(1, "Choose at least one permission."),
  limits: roleLimitsSchema.optional()
});

export const createRoleInputSchema = roleFieldsSchema;

export const updateRoleInputSchema = roleFieldsSchema
  .partial()
  .extend({
    id: z.string().min(1)
  });

export const updateContentBlockInputSchema = z.object({
  key: z.string().min(1),
  value: z.string()
});

export const updateStoreSettingsInputSchema = z.object({
  storeName: z.string().min(1),
  receiptFooter: z.string().optional()
});

export type CreateProductInput = z.input<typeof createProductInputSchema>;
export type UpdateProductInput = z.input<typeof updateProductInputSchema>;
export type CreateConcernInput = z.input<typeof createConcernInputSchema>;
export type UpdateConcernInput = z.input<typeof updateConcernInputSchema>;
export type CreateProductTypeInput = z.input<typeof createProductTypeInputSchema>;
export type UpdateProductTypeInput = z.input<typeof updateProductTypeInputSchema>;
export type CreateRoutineInput = z.input<typeof createRoutineInputSchema>;
export type UpdateRoutineInput = z.input<typeof updateRoutineInputSchema>;
export type CreateCategoryInput = z.input<typeof createCategoryInputSchema>;
export type UpdateCategoryInput = z.input<typeof updateCategoryInputSchema>;
export type AttachCategoryImageInput = z.input<typeof attachCategoryImageInputSchema>;
export type CreateVariantInput = z.input<typeof createVariantInputSchema>;
export type UpdateVariantInput = z.input<typeof updateVariantInputSchema>;
export type CreateOrderDraftInput = z.input<typeof createOrderDraftInputSchema>;
export type CompleteSaleInput = z.input<typeof completeSaleInputSchema>;
export type CreateStaffUserInput = z.input<typeof createStaffUserInputSchema>;
export type UpdateStaffUserInput = z.input<typeof updateStaffUserInputSchema>;
export type CreateRoleInput = z.input<typeof createRoleInputSchema>;
export type UpdateRoleInput = z.input<typeof updateRoleInputSchema>;
export type UpdateStoreSettingsInput = z.input<typeof updateStoreSettingsInputSchema>;
export type AdjustInventoryInput = z.input<typeof adjustInventoryInputSchema>;
export type CreateCustomerInput = z.input<typeof createCustomerInputSchema>;
export type UpdateCustomerInput = z.input<typeof updateCustomerInputSchema>;
export type CreatePromotionInput = z.input<typeof createPromotionInputSchema>;
export type UpdatePromotionInput = z.input<typeof updatePromotionInputSchema>;
export type UpdateOrderFulfilmentInput = z.input<typeof updateOrderFulfilmentInputSchema>;
export type PosReversalInput = z.input<typeof posReversalInputSchema>;
export type UpdateContentBlockInput = z.input<typeof updateContentBlockInputSchema>;
export type CreateMediaAssetInput = z.input<typeof createMediaAssetInputSchema>;
export type AttachProductImageInput = z.input<typeof attachProductImageInputSchema>;
export type ParsedCreateOrderDraftInput = z.output<typeof createOrderDraftInputSchema>;
export type ParsedCompleteSaleInput = z.output<typeof completeSaleInputSchema>;
