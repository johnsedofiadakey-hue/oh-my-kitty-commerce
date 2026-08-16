import type { Permission } from "@/lib/permissions/permissions";

export type CurrencyCode = "GHS";
export type MoneyMinorUnit = number;

export type SalesChannel = "ONLINE" | "POS" | "ADMIN_CREATED";

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

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
  customerId?: string | null;
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

export type SeoFields = {
  title?: string;
  description?: string;
};

export type ProductCare = {
  usage?: string;
  ingredients?: string;
  warnings?: string;
};
