import {
  sampleAuditLogs,
  sampleCategories,
  sampleCollections,
  sampleConcerns,
  sampleCustomers,
  sampleDeliveryRules,
  sampleInventoryMovements,
  sampleMedia,
  sampleOrders,
  samplePayments,
  samplePosShifts,
  sampleProducts,
  sampleProductTypes,
  samplePromotions,
  sampleRoles,
  sampleRoutines,
  sampleUsers,
  sampleVariants
} from "@/lib/commerce/sample-data";
import type { Order, Product, ProductVariant } from "@/lib/commerce/types";
import { formatMoney as formatCommerceMoney } from "@/lib/commerce/format";

export const adminData = {
  products: sampleProducts,
  variants: sampleVariants,
  categories: sampleCategories,
  collections: sampleCollections,
  concerns: sampleConcerns,
  productTypes: sampleProductTypes,
  routines: sampleRoutines,
  media: sampleMedia,
  customers: sampleCustomers,
  orders: sampleOrders,
  payments: samplePayments,
  inventoryMovements: sampleInventoryMovements,
  promotions: samplePromotions,
  deliveryRules: sampleDeliveryRules,
  posShifts: samplePosShifts,
  users: sampleUsers,
  roles: sampleRoles,
  auditLogs: sampleAuditLogs
};

export function getProductVariantRows() {
  return adminData.variants.map((variant) => {
    const product = findProduct(variant.productId);
    const lowStock = variant.trackInventory && variant.stockAvailable <= variant.lowStockThreshold;

    return {
      product,
      variant,
      lowStock
    };
  });
}

export function getAdminMetrics() {
  const revenue = adminData.orders
    .filter((order) => order.paymentStatus === "PAID")
    .reduce((total, order) => total + order.total, 0);
  const onlineOrders = adminData.orders.filter((order) => order.channel === "ONLINE").length;
  const posOrders = adminData.orders.filter((order) => order.channel === "POS").length;
  const lowStock = getProductVariantRows().filter((row) => row.lowStock).length;

  return {
    revenue,
    onlineOrders,
    posOrders,
    lowStock
  };
}

export function getOrderRows() {
  return adminData.orders.map((order) => ({
    order,
    payment: adminData.payments.find((payment) => payment.orderId === order.id) ?? null,
    customer: order.customerId
      ? adminData.customers.find((customer) => customer.id === order.customerId) ?? null
      : null
  }));
}

export function getChannelTotals() {
  return ["ONLINE", "POS", "ADMIN_CREATED"].map((channel) => {
    const orders = adminData.orders.filter((order) => order.channel === channel);

    return {
      channel,
      orders: orders.length,
      revenue: orders.reduce((total, order) => total + order.total, 0)
    };
  });
}

export function getInventoryRows() {
  return getProductVariantRows().map(({ product, variant, lowStock }) => ({
    product,
    variant,
    lowStock,
    movements: adminData.inventoryMovements.filter(
      (movement) => movement.variantId === variant.id
    )
  }));
}

export function formatMoney(amount: number) {
  return formatCommerceMoney(amount);
}

export function getProductTitle(product: Product | null) {
  return product?.title ?? "Unknown product";
}

export function getVariantLabel(variant: ProductVariant) {
  return `${variant.title} / ${variant.sku}`;
}

export function getOrderCustomerName(order: Order) {
  return order.customerSnapshot?.name ?? "Walk-in customer";
}

export function getRoleNames(roleIds: string[]) {
  return roleIds
    .map((roleId) => adminData.roles.find((role) => role.id === roleId)?.name ?? roleId)
    .join(", ");
}

/**
 * Firestore Admin SDK reads timestamp fields back as `Timestamp` instances,
 * not `Date` — they don't extend Date, have no `getTime()`, and coerce to a
 * bogus number (their `valueOf()` is a sortable string encoding, not epoch
 * ms), so `Intl.DateTimeFormat` silently formats the wrong date and any
 * `.getTime()` sort throws. Every field typed `Date` in commerce/types.ts is
 * really "Date | Timestamp" at runtime once it round-trips through
 * Firestore — this duck-types either into a real Date.
 */
function toRealDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }

  return null;
}

export function formatDate(value: Date | undefined) {
  const date = toRealDate(value);
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

/** Epoch ms for sorting by a possibly-missing, possibly-Timestamp date field. */
export function toSortableMillis(value: Date | undefined) {
  return toRealDate(value)?.getTime() ?? 0;
}

/** Whole days between `value` and now, or null when there's no date to compare. */
export function daysSince(value: Date | undefined) {
  const date = toRealDate(value);
  if (!date) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}

function findProduct(productId: string) {
  return adminData.products.find((product) => product.id === productId) ?? null;
}
