import {
  formatMoney,
  getAdminOperationsData,
  toSortableMillis
} from "@/lib/admin/operations-data";
import { requireAdminPermission } from "@/lib/auth/server";
import type { AdminOrderRow } from "@/lib/admin/operations-data";

export const dynamic = "force-dynamic";

type ProductProfitRow = {
  productId: string;
  title: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  costKnown: boolean;
};

type PeriodReport = {
  label: string;
  revenue: number;
  cost: number;
  costKnown: boolean;
  orderCount: number;
  rows: ProductProfitRow[];
};

function buildPeriodReport(label: string, orderRows: AdminOrderRow[], sinceMillis: number): PeriodReport {
  const paidInPeriod = orderRows.filter(
    (row) => row.order.paymentStatus === "PAID" && toSortableMillis(row.order.createdAt) >= sinceMillis
  );

  const byProduct = new Map<string, ProductProfitRow>();
  let totalCost = 0;
  let allCostKnown = true;

  for (const row of paidInPeriod) {
    for (const item of row.order.items) {
      const itemCostKnown = item.unitCost !== null && item.unitCost !== undefined;
      const itemCost = itemCostKnown ? (item.unitCost as number) * item.quantity : 0;
      if (!itemCostKnown) {
        allCostKnown = false;
      }
      totalCost += itemCost;

      const existing = byProduct.get(item.productId);
      if (existing) {
        existing.quantitySold += item.quantity;
        existing.revenue += item.lineTotal;
        existing.cost += itemCost;
        existing.costKnown = existing.costKnown && itemCostKnown;
      } else {
        byProduct.set(item.productId, {
          productId: item.productId,
          title: item.productTitle,
          quantitySold: item.quantity,
          revenue: item.lineTotal,
          cost: itemCost,
          costKnown: itemCostKnown
        });
      }
    }
  }

  return {
    label,
    revenue: paidInPeriod.reduce((total, row) => total + row.order.total, 0),
    cost: totalCost,
    costKnown: allCostKnown,
    orderCount: paidInPeriod.length,
    rows: Array.from(byProduct.values()).sort((a, b) => b.revenue - a.revenue)
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

function formatMargin(revenue: number, profit: number) {
  if (revenue <= 0) {
    return "—";
  }
  return `${Math.round((profit / revenue) * 100)}%`;
}

export default async function AdminFinancialPage() {
  await requireAdminPermission("reports.financial");
  const data = await getAdminOperationsData();

  const { startOfToday, sevenDaysAgo, thirtyDaysAgo } = getPeriodBoundaries();

  const periods = [
    buildPeriodReport("Today", data.orderRows, startOfToday),
    buildPeriodReport("Last 7 days", data.orderRows, sevenDaysAgo),
    buildPeriodReport("Last 30 days", data.orderRows, thirtyDaysAgo)
  ];

  const anyCostSet = periods.some((period) => period.rows.some((row) => row.costKnown));

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Financial</h1>
          <p className="app-subtitle">
            Revenue against cost of production, and the profit in between. Set a cost per unit on each product
            (Products &rarr; Edit) to see profit here.
          </p>
        </div>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      {!anyCostSet ? (
        <div className="admin-alert" role="status">
          No product has a cost per unit set yet, so profit can&apos;t be calculated. Add one from a product&apos;s
          Edit drawer.
        </div>
      ) : null}

      {periods.map((period) => {
        const profit = period.revenue - period.cost;
        return (
          <section className="admin-panel" key={period.label}>
            <div className="panel-header">
              <h2>{period.label}</h2>
              <span>{period.orderCount} order{period.orderCount === 1 ? "" : "s"}</span>
            </div>
            <div className="metric-grid">
              <article className="metric">
                <span>Revenue</span>
                <strong>{formatMoney(period.revenue)}</strong>
              </article>
              <article className="metric">
                <span>Cost{period.costKnown ? "" : " (partial)"}</span>
                <strong>{formatMoney(period.cost)}</strong>
              </article>
              <article className="metric">
                <span>Gross profit{period.costKnown ? "" : " (partial)"}</span>
                <strong>{formatMoney(profit)}</strong>
              </article>
              <article className="metric">
                <span>Margin</span>
                <strong>{formatMargin(period.revenue, profit)}</strong>
              </article>
            </div>
            <div className="admin-table five">
              <div className="admin-table-row header">
                <span>Product</span>
                <span>Qty sold</span>
                <span>Revenue</span>
                <span>Cost</span>
                <span>Profit</span>
              </div>
              {period.rows.map((row) => (
                <div className="admin-table-row" key={row.productId}>
                  <strong>{row.title}</strong>
                  <span>{row.quantitySold}</span>
                  <span>{formatMoney(row.revenue)}</span>
                  <span>{row.costKnown ? formatMoney(row.cost) : "Not set"}</span>
                  <span>{row.costKnown ? formatMoney(row.revenue - row.cost) : "—"}</span>
                </div>
              ))}
              {period.rows.length === 0 ? <p className="admin-help">No paid orders in this period.</p> : null}
            </div>
          </section>
        );
      })}
    </>
  );
}
