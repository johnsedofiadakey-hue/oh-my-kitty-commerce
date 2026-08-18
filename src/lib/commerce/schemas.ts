import { z } from "zod";

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

export const createProductInputSchema = z.object({
  title: z.string().min(2),
  slug: slugSchema,
  shortCopy: z.string().max(140).optional(),
  description: z.string().optional(),
  status: productStatusSchema.default("DRAFT"),
  categoryIds: z.array(z.string().min(1)).default([]),
  collectionIds: z.array(z.string().min(1)).default([]),
  concernIds: z.array(z.string().min(1)).default([]),
  productTypeIds: z.array(z.string().min(1)).default([]),
  routineIds: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
  mediaIds: z.array(z.string().min(1)).default([]),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  homepagePriority: z.number().int().min(0).optional(),
  seo: seoSchema.optional(),
  care: productCareSchema.optional()
});

export const updateProductInputSchema = createProductInputSchema.partial().extend({
  id: z.string().min(1)
});

export const createVariantInputSchema = z.object({
  productId: z.string().min(1),
  title: z.string().min(1),
  sku: z.string().min(2),
  barcode: z.string().optional(),
  optionValues: z.record(z.string(), z.string()).default({}),
  price: moneySchema,
  currency: z.literal("GHS").default("GHS"),
  compareAtPrice: moneySchema.nullable().optional(),
  cost: moneySchema.nullable().optional(),
  mediaIds: z.array(z.string().min(1)).default([]),
  trackInventory: z.boolean().default(true),
  stockOnHand: z.number().int().min(0).default(0),
  stockAvailable: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  active: z.boolean().default(true)
});

export const updateVariantInputSchema = createVariantInputSchema.partial().extend({
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
  idempotencyKey: z.string().min(8)
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

export const createCustomerInputSchema = z.object({
  authUid: z.string().nullable().optional(),
  name: z.string().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  createdFrom: salesChannelSchema
});

export const createPromotionInputSchema = z.object({
  code: z.string().min(2).transform((value) => value.toUpperCase()),
  type: z.enum(["PERCENT", "AMOUNT"]),
  value: z.number().positive(),
  active: z.boolean().default(true),
  channelRestrictions: z.array(salesChannelSchema).default([]),
  productRestrictions: z.array(z.string()).default([]),
  categoryRestrictions: z.array(z.string()).default([]),
  usageLimit: z.number().int().positive().nullable().optional(),
  requiresManagerApproval: z.boolean().default(false)
});

export const createConcernInputSchema = z.object({
  title: z.string().min(2),
  slug: slugSchema,
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true)
});

export const updateConcernInputSchema = createConcernInputSchema.partial().extend({
  id: z.string().min(1)
});

export const createProductTypeInputSchema = z.object({
  title: z.string().min(2),
  slug: slugSchema,
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true)
});

export const updateProductTypeInputSchema = createProductTypeInputSchema.partial().extend({
  id: z.string().min(1)
});

export const createRoutineInputSchema = z.object({
  title: z.string().min(2),
  slug: slugSchema,
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true)
});

export const updateRoutineInputSchema = createRoutineInputSchema.partial().extend({
  id: z.string().min(1)
});

export const createDeliveryRuleInputSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["PICKUP", "LOCAL_DELIVERY", "NATIONWIDE_DELIVERY"]),
  active: z.boolean().default(true),
  regions: z.array(z.string()).default([]),
  fee: moneySchema.default(0),
  freeAbove: moneySchema.nullable().optional(),
  estimate: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0)
});

export const updateDeliveryRuleInputSchema = createDeliveryRuleInputSchema.partial().extend({
  id: z.string().min(1)
});

export const createStaffUserInputSchema = z.object({
  id: z.string().min(1),
  uid: z.string().min(1),
  displayName: z.string().min(2),
  email: z.string().email(),
  status: z.enum(["ACTIVE", "DEACTIVATED"]).default("ACTIVE"),
  roleIds: z.array(z.string().min(1)).min(1, "Choose at least one role."),
  type: z.literal("ADMIN_OR_STAFF").default("ADMIN_OR_STAFF"),
  posEnabled: z.boolean().default(false),
  permissionOverrides: z.array(z.string()).default([])
});

export const updateStaffUserInputSchema = createStaffUserInputSchema
  .omit({ uid: true, type: true })
  .partial()
  .extend({
    id: z.string().min(1)
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
export type CreateVariantInput = z.input<typeof createVariantInputSchema>;
export type UpdateVariantInput = z.input<typeof updateVariantInputSchema>;
export type CreateOrderDraftInput = z.input<typeof createOrderDraftInputSchema>;
export type CompleteSaleInput = z.input<typeof completeSaleInputSchema>;
export type CreateStaffUserInput = z.input<typeof createStaffUserInputSchema>;
export type UpdateStaffUserInput = z.input<typeof updateStaffUserInputSchema>;
export type UpdateStoreSettingsInput = z.input<typeof updateStoreSettingsInputSchema>;
export type AdjustInventoryInput = z.input<typeof adjustInventoryInputSchema>;
export type CreateCustomerInput = z.input<typeof createCustomerInputSchema>;
export type ParsedCreateOrderDraftInput = z.output<typeof createOrderDraftInputSchema>;
export type ParsedCompleteSaleInput = z.output<typeof completeSaleInputSchema>;
