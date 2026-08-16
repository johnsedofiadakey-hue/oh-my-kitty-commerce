import type { Permission } from "@/lib/permissions/permissions";

export type CurrencyCode = "GHS";
export type MoneyMinorUnit = number;
export type EntityStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type SalesChannel = "ONLINE" | "POS" | "ADMIN_CREATED";

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type MediaType = "IMAGE" | "VIDEO" | "ANIMATION_FRAME" | "DOCUMENT";
export type MediaVisibility = "PUBLIC" | "STAFF" | "PRIVATE";

export type OrderStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "FULFILLED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type InventoryMovementType =
  | "STOCK_RECEIVED"
  | "ONLINE_SALE"
  | "POS_SALE"
  | "ADMIN_CREATED_SALE"
  | "RETURN_TO_STOCK"
  | "REFUND_NO_STOCK_RETURN"
  | "DAMAGE"
  | "LOSS"
  | "MANUAL_ADJUSTMENT";

export type PaymentProvider = "CASH" | "MANUAL" | "TBD";
export type PaymentMethod = "cash" | "mobile_money" | "card" | "manual_transfer" | "other";

export type FulfilmentStatus =
  | "UNFULFILLED"
  | "PROCESSING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "FULFILLED"
  | "CANCELLED";

export type Product = {
  id: string;
  title: string;
  slug: string;
  shortCopy?: string;
  description?: string;
  status: ProductStatus;
  categoryIds: string[];
  collectionIds: string[];
  tags: string[];
  mediaIds: string[];
  featured: boolean;
  homepagePriority?: number;
  seo?: SeoFields;
  care?: ProductCare;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ProductVariant = {
  id: string;
  productId: string;
  title: string;
  sku: string;
  barcode?: string;
  optionValues: Record<string, string>;
  price: MoneyMinorUnit;
  currency: CurrencyCode;
  compareAtPrice?: MoneyMinorUnit | null;
  cost?: MoneyMinorUnit | null;
  mediaIds: string[];
  trackInventory: boolean;
  stockOnHand: number;
  stockAvailable: number;
  lowStockThreshold: number;
  active: boolean;
};

export type Category = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  mediaId?: string;
  sortOrder: number;
  active: boolean;
  seo?: SeoFields;
};

export type Collection = {
  id: string;
  title: string;
  slug: string;
  productIds: string[];
  active: boolean;
  sortOrder: number;
};

export type MediaAsset = {
  id: string;
  storagePath: string;
  url: string;
  type: MediaType;
  visibility: MediaVisibility;
  alt: string;
  title?: string;
  tags: string[];
  usage: string[];
  uploadedBy: string;
};

export type Customer = {
  id: string;
  authUid?: string | null;
  name?: string;
  email?: string | null;
  phone?: string | null;
  createdFrom: SalesChannel;
};

export type OrderItem = {
  productId: string;
  variantId: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
  quantity: number;
  unitPrice: MoneyMinorUnit;
  discountTotal: MoneyMinorUnit;
  lineTotal: MoneyMinorUnit;
  mediaUrl?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  channel: SalesChannel;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfilmentStatus: FulfilmentStatus;
  customerId?: string | null;
  customerSnapshot?: CustomerSnapshot | null;
  items: OrderItem[];
  subtotal: MoneyMinorUnit;
  discountTotal: MoneyMinorUnit;
  deliveryTotal: MoneyMinorUnit;
  taxTotal: MoneyMinorUnit;
  total: MoneyMinorUnit;
  currency: CurrencyCode;
  createdBy?: string | null;
  staffId?: string | null;
  posShiftId?: string | null;
  idempotencyKey: string;
};

export type CustomerSnapshot = {
  name?: string;
  email?: string | null;
  phone?: string | null;
};

export type Payment = {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: MoneyMinorUnit;
  currency: CurrencyCode;
  providerReference?: string | null;
  idempotencyKey: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type InventoryMovement = {
  id: string;
  productId: string;
  variantId: string;
  type: InventoryMovementType;
  quantityDelta: number;
  stockAfter: number;
  orderId?: string | null;
  reason: string;
  actorId: string;
  channel?: SalesChannel;
  createdAt?: Date;
};

export type Promotion = {
  id: string;
  code: string;
  type: "PERCENT" | "AMOUNT";
  value: number;
  active: boolean;
  channelRestrictions: SalesChannel[];
  productRestrictions: string[];
  categoryRestrictions: string[];
  startsAt?: Date | null;
  endsAt?: Date | null;
  usageLimit?: number | null;
  usedCount: number;
  requiresManagerApproval: boolean;
};

export type DeliveryRule = {
  id: string;
  name: string;
  type: "PICKUP" | "LOCAL_DELIVERY" | "NATIONWIDE_DELIVERY";
  active: boolean;
  regions: string[];
  fee: MoneyMinorUnit;
  freeAbove?: MoneyMinorUnit | null;
  estimate?: string;
  sortOrder: number;
};

export type PosShift = {
  id: string;
  staffId: string;
  status: "OPEN" | "CLOSED" | "REVIEWED";
  openedAt: Date;
  closedAt?: Date | null;
  openingCash: MoneyMinorUnit;
  closingCash?: MoneyMinorUnit | null;
  expectedCash?: MoneyMinorUnit | null;
  difference?: MoneyMinorUnit | null;
  notes?: string;
};

export type ManagerApproval = {
  id: string;
  status: "PENDING" | "APPROVED" | "DENIED" | "EXPIRED";
  action: "POS_REFUND" | "POS_VOID" | "PRICE_OVERRIDE" | "LARGE_DISCOUNT" | "INVENTORY_ADJUSTMENT";
  requestedBy: string;
  approvedBy?: string | null;
  requiredPermission: Permission;
  reason: string;
};

export type AuditLog = {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  reason?: string;
  approvalId?: string | null;
  createdAt: Date;
};

export type SeoFields = {
  title?: string;
  description?: string;
};

export type ProductCare = {
  usage?: string;
  ingredients?: string;
  warnings?: string;
};
