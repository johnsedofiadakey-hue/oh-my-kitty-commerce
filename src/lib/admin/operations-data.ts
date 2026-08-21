import { cache } from "react";
import {
  adminData,
  daysSince,
  formatDate,
  formatMoney,
  getOrderCustomerName,
  getProductTitle,
  getVariantLabel,
  toSortableMillis
} from "@/lib/admin/sample-admin-data";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import type {
  AuditLog,
  Customer,
  DeliveryRule,
  InventoryMovement,
  MediaAsset,
  Order,
  Payment,
  PosShift,
  Product,
  ProductVariant,
  Promotion
} from "@/lib/commerce/types";

export type AdminOperationsSource = "live" | "sample";

export type AdminOrderRow = {
  order: Order;
  payment: Payment | null;
  customer: Customer | null;
};

export type AdminInventoryRow = {
  product: Product | null;
  variant: ProductVariant;
  lowStock: boolean;
  movements: InventoryMovement[];
};

export type AdminChannelTotal = {
  channel: Order["channel"];
  orders: number;
  revenue: number;
};

export type AdminTopProduct = {
  productId: string;
  title: string;
  quantity: number;
  revenue: number;
};

export type AdminOperationsData = {
  source: AdminOperationsSource;
  sourceMessage?: string;
  products: Product[];
  variants: ProductVariant[];
  customers: Customer[];
  orders: Order[];
  payments: Payment[];
  media: MediaAsset[];
  inventoryMovements: InventoryMovement[];
  promotions: Promotion[];
  deliveryRules: DeliveryRule[];
  posShifts: PosShift[];
  auditLogs: AuditLog[];
  orderRows: AdminOrderRow[];
  inventoryRows: AdminInventoryRow[];
  channelTotals: AdminChannelTotal[];
  topProducts: AdminTopProduct[];
  metrics: {
    revenue: number;
    onlineOrders: number;
    posOrders: number;
    lowStock: number;
    cashSales: number;
    activeShifts: number;
    discountUsage: number;
  };
};

/**
 * Cached per-request: the admin layout reads this for nav badge counts and
 * every admin page reads it again for its own view — without `cache()` that
 * would be a duplicate Firestore fetch on every single page load.
 */
export const getAdminOperationsData = cache(async (): Promise<AdminOperationsData> => {
  const context = getCommerceServerContext();
  if (!context) {
    return sampleOperationsData("Firebase Admin is not configured yet. Showing sample operations.");
  }

  try {
    const products = await context.repo.listProducts();
    const variants = (
      await Promise.all(products.map((product) => context.repo.listVariants(product.id)))
    ).flat();
    const [
      customers,
      media,
      orders,
      payments,
      promotions,
      deliveryRules,
      posShifts,
      auditLogs
    ] = await Promise.all([
      context.repo.listCustomers(),
      context.repo.listMedia(),
      context.repo.listOrders(),
      context.repo.listPayments(),
      context.repo.listPromotions(),
      context.repo.listDeliveryRules(),
      context.repo.listPosShifts(),
      context.repo.listAuditLogs()
    ]);
    const inventoryMovements = (
      await Promise.all(variants.map((variant) => context.repo.listInventoryMovements(variant.id)))
    ).flat();

    return buildOperationsData({
      auditLogs,
      customers,
      deliveryRules,
      inventoryMovements,
      media,
      orders,
      payments,
      posShifts,
      products,
      promotions,
      source: "live",
      variants
    });
  } catch {
    return sampleOperationsData("Firestore operations data is not ready. Showing sample operations.");
  }
});

export {
  daysSince,
  formatDate,
  formatMoney,
  getOrderCustomerName,
  getProductTitle,
  getVariantLabel,
  toSortableMillis
};

function sampleOperationsData(sourceMessage: string): AdminOperationsData {
  return buildOperationsData({
    auditLogs: adminData.auditLogs,
    customers: adminData.customers,
    deliveryRules: adminData.deliveryRules,
    inventoryMovements: adminData.inventoryMovements,
    media: adminData.media,
    orders: adminData.orders,
    payments: adminData.payments,
    posShifts: adminData.posShifts,
    products: adminData.products,
    promotions: adminData.promotions,
    source: "sample",
    sourceMessage,
    variants: adminData.variants
  });
}

function buildOperationsData(input: {
  source: AdminOperationsSource;
  sourceMessage?: string;
  products: Product[];
  variants: ProductVariant[];
  customers: Customer[];
  orders: Order[];
  payments: Payment[];
  media: MediaAsset[];
  inventoryMovements: InventoryMovement[];
  promotions: Promotion[];
  deliveryRules: DeliveryRule[];
  posShifts: PosShift[];
  auditLogs: AuditLog[];
}): AdminOperationsData {
  const inventoryRows = input.variants.map((variant) => {
    const product = input.products.find((entry) => entry.id === variant.productId) ?? null;
    const lowStock = variant.trackInventory && variant.stockAvailable <= variant.lowStockThreshold;

    return {
      product,
      variant,
      lowStock,
      movements: input.inventoryMovements.filter((movement) => movement.variantId === variant.id)
    };
  });
  const orderRows = [...input.orders]
    .sort((a, b) => toSortableMillis(b.createdAt) - toSortableMillis(a.createdAt))
    .map((order) => ({
      order,
      payment: input.payments.find((payment) => payment.orderId === order.id) ?? null,
      customer: order.customerId
        ? input.customers.find((customer) => customer.id === order.customerId) ?? null
        : null
    }));
  const channelTotals: AdminChannelTotal[] = (["ONLINE", "POS", "ADMIN_CREATED"] as const).map(
    (channel) => {
      const orders = input.orders.filter((order) => order.channel === channel);

      return {
        channel,
        orders: orders.length,
        revenue: orders.reduce((total, order) => total + order.total, 0)
      };
    }
  );
  const revenue = input.orders
    .filter((order) => order.paymentStatus === "PAID")
    .reduce((total, order) => total + order.total, 0);
  const cashSales = input.payments
    .filter((payment) => payment.method === "cash")
    .reduce((total, payment) => total + payment.amount, 0);
  const topProducts = Object.values(
    input.orders
      .filter((order) => order.paymentStatus === "PAID")
      .flatMap((order) => order.items)
      .reduce<Record<string, AdminTopProduct>>((totals, item) => {
        const existing = totals[item.productId];
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.lineTotal;
        } else {
          totals[item.productId] = {
            productId: item.productId,
            title: item.productTitle,
            quantity: item.quantity,
            revenue: item.lineTotal
          };
        }
        return totals;
      }, {})
  )
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    ...input,
    channelTotals,
    inventoryRows,
    topProducts,
    metrics: {
      activeShifts: input.posShifts.filter((shift) => shift.status === "OPEN").length,
      cashSales,
      discountUsage: input.promotions.reduce((total, promotion) => total + promotion.usedCount, 0),
      lowStock: inventoryRows.filter((row) => row.lowStock).length,
      onlineOrders: input.orders.filter((order) => order.channel === "ONLINE").length,
      posOrders: input.orders.filter((order) => order.channel === "POS").length,
      revenue
    },
    orderRows
  };
}
