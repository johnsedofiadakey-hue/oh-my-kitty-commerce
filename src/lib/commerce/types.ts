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
  | "PRODUCTION"
  | "DAMAGE"
  | "LOSS"
  | "MANUAL_ADJUSTMENT"
  // BUNDLE_CONSUMED: system-generated when a set sells and its components
  // get drawn down — never user-selectable in the manual "Adjust stock"
  // form. BUNDLE_ASSEMBLED is retained only for historical movements from
  // the old pre-assembled-kit model; nothing generates it anymore.
  | "BUNDLE_ASSEMBLED"
  | "BUNDLE_CONSUMED";

export type PaymentProvider = "CASH" | "MANUAL" | "PAYSTACK" | "TBD";
export type PaymentMethod = "cash" | "mobile_money" | "card" | "manual_transfer" | "other";

export type FulfilmentStatus =
  | "UNFULFILLED"
  | "PROCESSING"
  | "PACKED"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "FULFILLED"
  | "RETURNED"
  | "CANCELLED";

/**
 * How far along an order is, for the forward-only guard. A change that moves
 * to a lower rank is going backwards and needs an explicit override — that is
 * the move which lets an order be packed a second time.
 * CANCELLED and RETURNED sit outside the ladder: they are ends, reachable
 * from anywhere before completion.
 */
export const FULFILMENT_RANK: Record<FulfilmentStatus, number> = {
  UNFULFILLED: 0,
  PROCESSING: 1,
  PACKED: 2,
  READY_FOR_PICKUP: 3,
  OUT_FOR_DELIVERY: 3,
  FULFILLED: 4,
  RETURNED: -1,
  CANCELLED: -1
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  shortCopy?: string;
  description?: string;
  status: ProductStatus;
  collectionIds: string[];
  concernIds: string[];
  productTypeIds: string[];
  routineIds: string[];
  tags: string[];
  mediaIds: string[];
  featured: boolean;
  bestSeller: boolean;
  freeDelivery: boolean;
  homepagePriority?: number;
  seo?: SeoFields;
  care?: ProductCare;
  createdAt?: Date;
  updatedAt?: Date;
};

export type RecipeItem = {
  materialId: string;
  // How much of the material one unit of this variant uses, in the
  // material's own unit (e.g. 2.5 "ml" of a material priced per ml).
  quantityPerUnit: number;
};

export type BundleComponentItem = {
  variantId: string;
  // How many units of this component one unit of the kit consumes.
  quantity: number;
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
  // Manually entered cost per unit. When `recipe` is set (non-empty), this
  // is instead derived server-side from the recipe's materials and their
  // current prices, and manual edits to it are overwritten on save.
  cost?: MoneyMinorUnit | null;
  recipe?: RecipeItem[];
  // Free-text production steps for this recipe — mixing ratios, cure time,
  // assembly order, whatever the person actually making it needs to know.
  // Not used in any cost/inventory calculation, purely instructional.
  recipeInstructions?: string;
  // Non-empty means this variant is a "set" ("Chronic Infection Set" etc.)
  // built from other product variants, not raw materials. A set has no
  // stock of its own — see computeAvailableStock() and
  // decrementInventoryForOrder(), which compute/draw availability straight
  // from these components instead of this variant's own stockOnHand/
  // stockAvailable (which are unused and ignored once this is set). A
  // component here must not itself be a set (no nesting).
  bundleComponents?: BundleComponentItem[];
  mediaIds: string[];
  trackInventory: boolean;
  stockOnHand: number;
  stockAvailable: number;
  lowStockThreshold: number;
  active: boolean;
};

/**
 * Splits what goes *into* the product from what it ships *in*, so a recipe
 * can report "GHS 11 product, GHS 4 packaging" rather than one opaque total.
 */
export type RawMaterialKind = "INGREDIENT" | "PACKAGING" | "OTHER";

export type RawMaterial = {
  id: string;
  name: string;
  // Unit the material is measured/costed in, e.g. "ml", "g", "piece", "cap".
  unit: string;
  kind: RawMaterialKind;
  /**
   * Maintained by purchases as a weighted average of what was actually paid,
   * not typed by hand — see applyPurchaseToMaterial. Editable directly only
   * for opening balances and corrections.
   */
  costPerUnit: MoneyMinorUnit;
  /** In the material's own `unit`. Can go negative when production outruns the records. */
  stockOnHand: number;
  lowStockThreshold: number;
  supplier?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * A delivery of material from a supplier. Raises stock and re-averages
 * costPerUnit. Optionally posts an Expense so the money leaving the account
 * is recorded once, in the P&L, rather than twice.
 */
export type MaterialPurchase = {
  id: string;
  materialId: string;
  /** In the material's own unit. */
  quantity: number;
  /** What was paid in total for that quantity — unit cost is derived, not entered. */
  totalCost: MoneyMinorUnit;
  /** Snapshot of the resulting weighted-average unit cost, for the history view. */
  unitCostAfter: MoneyMinorUnit;
  date: Date;
  supplier?: string;
  note?: string;
  /** Set when this purchase also posted to Expenses. */
  expenseId?: string | null;
  createdBy: string;
  createdAt?: Date;
};

/** One material consumed by a production run, frozen at the cost of that moment. */
export type ProductionRunLine = {
  materialId: string;
  materialName: string;
  unit: string;
  kind: RawMaterialKind;
  quantityUsed: number;
  unitCostAtTime: MoneyMinorUnit;
  lineCost: MoneyMinorUnit;
};

/**
 * A batch of finished goods made in-house. Consumes materials, raises finished
 * stock, and keeps its own cost snapshot — a later change to a material's
 * price must not rewrite what a past batch cost to make.
 */
export type ProductionRun = {
  id: string;
  productId: string;
  variantId: string;
  productTitle: string;
  variantTitle: string;
  quantityProduced: number;
  unitCost: MoneyMinorUnit;
  totalCost: MoneyMinorUnit;
  lines: ProductionRunLine[];
  /** Materials that went negative on this run, for the warning banner in history. */
  shortfallMaterialNames: string[];
  note?: string;
  createdBy: string;
  createdAt?: Date;
};

export type Concern = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  sortOrder: number;
  active: boolean;
};

export type ProductType = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  sortOrder: number;
  active: boolean;
};

export type Routine = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  sortOrder: number;
  active: boolean;
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

export type ContentBlock = {
  id: string;
  key: string;
  value: string;
  updatedBy?: string;
  updatedAt?: Date;
};

export type Customer = {
  id: string;
  authUid?: string | null;
  name?: string;
  email?: string | null;
  phone?: string | null;
  // Not always a sale — a guidance-form submission is a real contact worth
  // keeping even if it never becomes an order.
  createdFrom: SalesChannel | "GUIDANCE_REQUEST";
};

export type OrderItem = {
  productId: string;
  variantId: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
  quantity: number;
  unitPrice: MoneyMinorUnit;
  // Snapshotted from the variant's cost at sale time, same reasoning as
  // unitPrice — a later cost edit must not change what a past order's
  // profit report shows. Null when no cost was set on the variant yet.
  unitCost: MoneyMinorUnit | null;
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
  // Snapshotted from the chosen DeliveryRule at checkout — same reason
  // customerSnapshot/productTitle are snapshots: a later edit or deletion of
  // the delivery rule must not change what a past order shows. Several of
  // this store's rules have a $0 fee (courier collects cash on arrival, or
  // it's genuinely free/pickup), so deliveryTotal alone can't tell staff
  // which method a customer actually chose — this is the only record of it.
  deliveryMethod?: DeliveryMethodSnapshot | null;
  taxTotal: MoneyMinorUnit;
  // Card/mobile-money processing fee passed on to the customer, already
  // folded into `total` — 0 for cash, manual transfer, and POS's manual
  // card flow, since no Paystack fee is actually incurred on those.
  paymentFeeTotal: MoneyMinorUnit;
  total: MoneyMinorUnit;
  currency: CurrencyCode;
  createdBy?: string | null;
  staffId?: string | null;
  posShiftId?: string | null;
  idempotencyKey: string;
  /** Set when packing was attempted and blocked — see PackHold. */
  packHold?: PackHold | null;
  createdAt?: Date;
  promotionId?: string | null;
  promoCode?: string | null;
};

export type CustomerSnapshot = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
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
  requiresFreeDeliveryItem?: boolean;
  estimate?: string;
  sortOrder: number;
};

export type DeliveryMethodSnapshot = {
  ruleId: string;
  name: string;
  type: DeliveryRule["type"];
  estimate?: string;
};

export type ParcelStatus = "PACKED" | "DISPATCHED" | "DELIVERED" | "RETURNED";

/**
 * One physical line on the packing slip. Sets are expanded into the items
 * actually going in the box: an order line reading "Chronic Infection Set x1"
 * is useless to whoever is picking it, so each component is listed with the
 * set it came from.
 */
export type ParcelItem = {
  productTitle: string;
  variantTitle: string;
  sku: string;
  quantity: number;
  /** Set this component belongs to, when the order line was a set. */
  viaSetTitle?: string;
};

/**
 * The parcel is the physical thing, tracked apart from the order. Its whole
 * reason for existing is that an order may only have one live parcel: packing
 * an order that already has one is refused outright, which is what stops the
 * same order being packed and sent twice.
 *
 * A genuine second parcel (first one lost, or returned and going back out)
 * carries reshipOfParcelId and a reason, so it reads as the exception it is
 * rather than hiding among ordinary packs.
 */
export type Parcel = {
  id: string;
  /** Human-readable, printed on the slip: OMK-OVMZNAUA-P1. */
  parcelNumber: string;
  orderId: string;
  orderNumber: string;
  status: ParcelStatus;
  items: ParcelItem[];
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryMethodName?: string;
  isPickup: boolean;
  packedBy: string;
  packedByName?: string;
  packedAt: Date;
  dispatchedAt?: Date | null;
  dispatchedBy?: string | null;
  /** Rider or courier who took it — free text, they are not system users. */
  courier?: string;
  deliveredAt?: Date | null;
  returnedAt?: Date | null;
  returnedBy?: string | null;
  returnReason?: string;
  reshipOfParcelId?: string | null;
  reshipReason?: string;
  createdAt?: Date;
};

/**
 * Why an order could not be packed — a missing item, usually. Recorded on the
 * order so the next person sees the reason instead of trying again and hitting
 * the same wall.
 */
export type PackHold = {
  reason: string;
  heldBy: string;
  heldAt: Date;
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

export type StoreSettings = {
  id: "store";
  storeName: string;
  receiptFooter?: string;
  updatedBy?: string;
  updatedAt?: Date;
};

export type StaffUser = {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  status: "ACTIVE" | "DEACTIVATED";
  roleIds: string[];
  type: "ADMIN_OR_STAFF";
  posEnabled: boolean;
  permissionOverrides?: Permission[];
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
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

export type PushSubscriptionPlatform = "windows-chrome" | "android-chrome" | "other";

/** id == the FCM token itself — an idempotent set, not a generated id, so re-registering the same device just refreshes lastSeenAt. */
export type PushSubscription = {
  id: string;
  token: string;
  staffId: string;
  platform: PushSubscriptionPlatform;
  userAgent: string;
  createdAt: Date;
  lastSeenAt: Date;
};

export type NotificationLogType = "NEW_ONLINE_ORDER" | "NEW_GUIDANCE_REQUEST";

export type NotificationLog = {
  id: string;
  type: NotificationLogType;
  title: string;
  body: string;
  entityType: "order" | "guidanceRequest";
  entityId: string;
  entityRef: string;
  // Set only for entityType "guidanceRequest" — the customer's own number,
  // so the admin UI can offer a "reply on WhatsApp" link straight from here.
  contactNumber?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
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

// ---- Accounting: expenses, recurring templates, capital assets, payroll ----
// Deliberately a simple categorized ledger, not double-entry bookkeeping —
// no debits/credits, no chart of accounts. See src/lib/admin/financial-data.ts
// for how these roll up into a profit & loss view.

export type ExpenseCategory = {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  active: boolean;
};

export type Expense = {
  id: string;
  categoryId: string;
  /** What the money went on, e.g. "Bottles from supplier". Optional — rows predating this field have none. */
  name?: string;
  amount: MoneyMinorUnit;
  date: Date;
  note?: string;
  receiptMediaId?: string | null;
  // Set only when this row was generated by "log as paid" from a recurring
  // template — lets the Expenses list show where it came from.
  recurringTemplateId?: string | null;
  createdBy: string;
  createdAt?: Date;
};

export type RecurringExpenseTemplate = {
  id: string;
  categoryId: string;
  label: string;
  amount: MoneyMinorUnit;
  // Day of the month it's due (1-28, kept short so it's valid in every
  // month) — purely informational, doesn't generate anything by itself.
  dayOfMonth: number;
  active: boolean;
  // "2026-09" — the last period a real Expense was logged for this
  // template, so the Expenses page can tell you what's still due this month
  // without generating duplicates.
  lastLoggedPeriod?: string | null;
  createdAt?: Date;
};

export type CapitalAssetCategory = "EQUIPMENT" | "FURNITURE" | "MACHINE" | "PROPERTY" | "OTHER";

export type CapitalAsset = {
  id: string;
  name: string;
  category: CapitalAssetCategory;
  purchaseDate: Date;
  purchaseCost: MoneyMinorUnit;
  location?: string;
  notes?: string;
  trackDepreciation: boolean;
  // Only meaningful (and required by the form) when trackDepreciation is true.
  usefulLifeYears?: number | null;
  createdAt?: Date;
};

export type Worker = {
  id: string;
  name: string;
  role?: string;
  status: "ACTIVE" | "INACTIVE";
  monthlySalary: MoneyMinorUnit;
  startDate?: Date | null;
  phone?: string;
  ghanaCardNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  momoNumber?: string;
  momoNetwork?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  parentGuardianName?: string;
  siblingsInfo?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PayrollDeduction = {
  label: string;
  amount: MoneyMinorUnit;
};

export type PayrollPayment = {
  id: string;
  workerId: string;
  // "2026-09" — one payment per worker per period; enforced at the
  // operation layer, not by document id, so a correction can be re-saved.
  period: string;
  grossAmount: MoneyMinorUnit;
  deductions: PayrollDeduction[];
  netAmount: MoneyMinorUnit;
  paidDate: Date;
  note?: string;
  createdBy: string;
  createdAt?: Date;
};

export type ManualRevenueEntry = {
  id: string;
  label: string;
  amount: MoneyMinorUnit;
  date: Date;
  note?: string;
  createdBy: string;
  createdAt?: Date;
};
