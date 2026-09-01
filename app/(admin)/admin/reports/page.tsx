import {
  formatMoney,
  getAdminOperationsData,
  toSortableMillis
} from "@/lib/admin/operations-data";
import { requireAdminPermission } from "@/lib/auth/server";
import type { AdminInventoryRow, AdminOrderRow } from "@/lib/admin/operations-data";

export const dynamic = "force-dynamic";

type PeriodReport = {
  label: string;
  revenue: number;
  orderCount: number;
  rows: {
    productId: string;
    title: string;
    price: number;
    quantitySold: number;
    revenue: number;
    quantityLeft: number;
  }[];
};

function buildPeriodReport(
  label: string,
  orderRows: AdminOrderRow[],
  inventoryRows: AdminInventoryRow[],
  sinceMillis: number
): PeriodReport {
  const paidInPeriod = orderRows.filter(
    (row) => row.order.paymentStatus === "PAID" && toSortableMillis(row.order.createdAt) >= sinceMillis
  );

  const stockByProductId = new Map<string, number>();
  for (const row of inventoryRows) {
    const productId = row.variant.productId;
    stockByProductId.set(productId, (stockByProductId.get(productId) ?? 0) + row.variant.stockAvailable);
  }

  const byProduct = new Map<
    string,
    { title: string; price: number; quantitySold: number; revenue: number }
  >();

  for (const row of paidInPeriod) {
    for (const item of row.order.items) {
      const existing = byProduct.get(item.productId);
      if (existing) {
        existing.quantitySold += item.quantity;
        existing.revenue += item.lineTotal;
        existing.price = item.unitPrice;
      } else {
        byProduct.set(item.productId, {
          title: item.productTitle,
          price: item.unitPrice,
          quantitySold: item.quantity,
          revenue: item.lineTotal
        });
      }
    }
  }

  const rows = Array.from(byProduct.entries())
    .map(([productId, entry]) => ({
      productId,
      title: entry.title,
      price: entry.price,
      quantitySold: entry.quantitySold,
      revenue: entry.revenue,
      quantityLeft: stockByProductId.get(productId) ?? 0
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    label,
    revenue: paidInPeriod.reduce((total, row) => total + row.order.total, 0),
    orderCount: paidInPeriod.length,
    rows
  };
}

function getPeriodBoundaries() {
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  return {
    startOfToday: startOfToday.getTime(),
    sevenDaysAgo: now - 7 * 24 * 60 * 60 * 1000,
    thirtyDaysAgo: now - 30 * 24 * 60 * 60 * 1000
  };
}

export default async function AdminReportsPage() {
  await requireAdminPermission("reports.view");
  const data = await getAdminOperationsData();

  const { startOfToday, sevenDaysAgo, thirtyDaysAgo } = getPeriodBoundaries();

  const periods = [
    buildPeriodReport("Today", data.orderRows, data.inventoryRows, startOfToday),
    buildPeriodReport("Last 7 days", data.orderRows, data.inventoryRows, sevenDaysAgo),
    buildPeriodReport("Last 30 days", data.orderRows, data.inventoryRows, thirtyDaysAgo)
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Reports</h1>
          <p className="app-subtitle">
            Sales, quantity sold, and stock remaining by day, week, and month. For today at a glance, see the
            Dashboard.
          </p>
        </div>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}

      {periods.map((period) => (
        <section className="admin-panel" key={period.label}>
          <div className="panel-header">
            <h2>{period.label}</h2>
            <span>
              {period.orderCount} order{period.orderCount === 1 ? "" : "s"} &middot; {formatMoney(period.revenue)}{" "}
              revenue
            </span>
          </div>
          <div className="admin-table five">
            <div className="admin-table-row header">
              <span>Product</span>
              <span>Price</span>
              <span>Qty sold</span>
              <span>Revenue</span>
              <span>Qty left</span>
            </div>
            {period.rows.map((row) => (
              <div className="admin-table-row" key={row.productId}>
                <strong>{row.title}</strong>
                <span>{formatMoney(row.price)}</span>
                <span>{row.quantitySold}</span>
                <span>{formatMoney(row.revenue)}</span>
                <span>{row.quantityLeft}</span>
              </div>
            ))}
            {period.rows.length === 0 ? <p className="admin-help">No paid orders in this period.</p> : null}
          </div>
        </section>
      ))}

      <section className="admin-panel">
        <div className="panel-header">
          <h2>Top products</h2>
          <span>By revenue, all time</span>
        </div>
        <div className="admin-table three">
          <div className="admin-table-row header">
            <span>Product</span>
            <span>Units sold</span>
            <span>Revenue</span>
          </div>
          {data.topProducts.map((row) => (
            <div className="admin-table-row" key={row.productId}>
              <strong>{row.title}</strong>
              <span>{row.quantity}</span>
              <span>{formatMoney(row.revenue)}</span>
            </div>
          ))}
          {data.topProducts.length === 0 ? (
            <p className="admin-help">No paid orders yet.</p>
          ) : null}
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric">
          <span>Discount usage</span>
          <strong>{data.metrics.discountUsage}</strong>
        </article>
      </section>
    </>
  );
}
