import Link from "next/link";
import type { Route } from "next";
import {
  formatMoney,
  getAdminOperationsData,
  toSortableMillis
} from "@/lib/admin/operations-data";
import { requireAdminPermission } from "@/lib/auth/server";
import type { AdminInventoryRow, AdminOrderRow } from "@/lib/admin/operations-data";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

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

type SalesTrendPoint = {
  label: string;
  revenue: number;
  orders: number;
};

function buildPeriodReport(
  label: string,
  orderRows: AdminOrderRow[],
  inventoryRows: AdminInventoryRow[],
  sinceMillis: number,
  untilMillis = Date.now()
): PeriodReport {
  const paidInPeriod = orderRows.filter((row) => {
    const millis = toSortableMillis(row.order.createdAt);
    return row.order.paymentStatus === "PAID" && millis >= sinceMillis && millis <= untilMillis;
  });

  const stockByProductId = new Map<string, number>();
  for (const row of inventoryRows) {
    const productId = row.variant.productId;
    stockByProductId.set(productId, (stockByProductId.get(productId) ?? 0) + row.availableStock);
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
    now,
    startOfToday: startOfToday.getTime(),
    sevenDaysAgo: now - 7 * DAY_MS,
    thirtyDaysAgo: now - 30 * DAY_MS,
    previousThirtyDaysAgo: now - 60 * DAY_MS
  };
}

function buildSalesTrend(orderRows: AdminOrderRow[], days = 30): SalesTrendPoint[] {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const startMillis = end.getTime() - (days - 1) * DAY_MS;
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(startMillis + index * DAY_MS);
    return {
      label: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      revenue: 0,
      orders: 0
    };
  });

  for (const row of orderRows) {
    if (row.order.paymentStatus !== "PAID") {
      continue;
    }

    const index = Math.floor((toSortableMillis(row.order.createdAt) - startMillis) / DAY_MS);
    if (index >= 0 && index < buckets.length) {
      buckets[index].revenue += row.order.total;
      buckets[index].orders += 1;
    }
  }

  return buckets;
}

function formatAverageOrder(revenue: number, orderCount: number) {
  return orderCount > 0 ? formatMoney(Math.round(revenue / orderCount)) : formatMoney(0);
}

function formatDeltaLabel(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? "New activity" : "No prior activity";
  }

  const change = Math.round(((current - previous) / previous) * 100);
  return `${change >= 0 ? "+" : ""}${change}% vs previous 30 days`;
}

function percentWidth(value: number, max: number) {
  if (max <= 0 || value <= 0) {
    return "4%";
  }

  return `${Math.max(4, Math.round((value / max) * 100))}%`;
}

function formatChannelName(channel: string) {
  return channel
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ReportTrend({ points }: { points: SalesTrendPoint[] }) {
  const values = points.map((point) => point.revenue);
  const max = Math.max(1, ...values);
  const linePoints = points
    .map((point, index) => {
      const x = points.length <= 1 ? 0 : (index / (points.length - 1)) * 100;
      const y = 40 - (point.revenue / max) * 32;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const areaPoints = `0,44 ${linePoints} 100,44`;

  return (
    <svg aria-hidden="true" className="reports-trend" preserveAspectRatio="none" viewBox="0 0 100 44">
      <polygon points={areaPoints} />
      <polyline points={linePoints} />
    </svg>
  );
}

function ReportMetric({
  label,
  value,
  note,
  tone = "accent"
}: {
  label: string;
  value: string;
  note: string;
  tone?: "accent" | "green" | "dark" | "warn";
}) {
  return (
    <article className={`report-metric ${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <small>{note}</small>
    </article>
  );
}

export default async function AdminReportsPage() {
  await requireAdminPermission("reports.view");
  const data = await getAdminOperationsData();

  const { now, startOfToday, sevenDaysAgo, thirtyDaysAgo, previousThirtyDaysAgo } = getPeriodBoundaries();

  const periods = [
    buildPeriodReport("Today", data.orderRows, data.inventoryRows, startOfToday, now),
    buildPeriodReport("Last 7 days", data.orderRows, data.inventoryRows, sevenDaysAgo, now),
    buildPeriodReport("Last 30 days", data.orderRows, data.inventoryRows, thirtyDaysAgo, now)
  ];
  const activePeriod = periods[2];
  const previousPeriod = buildPeriodReport(
    "Previous 30 days",
    data.orderRows,
    data.inventoryRows,
    previousThirtyDaysAgo,
    thirtyDaysAgo - 1
  );
  const trend = buildSalesTrend(data.orderRows);
  const paidChannelTotals = (["ONLINE", "POS", "ADMIN_CREATED"] as const).map((channel) => {
    const orders = data.orders.filter((order) => {
      const millis = toSortableMillis(order.createdAt);
      return order.channel === channel && order.paymentStatus === "PAID" && millis >= thirtyDaysAgo && millis <= now;
    });

    return {
      channel,
      orders: orders.length,
      revenue: orders.reduce((total, order) => total + order.total, 0)
    };
  });
  const maxChannelRevenue = Math.max(1, ...paidChannelTotals.map((row) => row.revenue));
  const lowStockRows = data.inventoryRows.filter((row) => row.lowStock).slice(0, 5);
  const posOrders = data.orders.filter((order) => {
    const millis = toSortableMillis(order.createdAt);
    return order.channel === "POS" && millis >= thirtyDaysAgo && millis <= now;
  });
  const posRevenue = posOrders
    .filter((order) => order.paymentStatus === "PAID")
    .reduce((total, order) => total + order.total, 0);
  const posRefundsOrVoids = posOrders.filter(
    (order) =>
      order.status === "CANCELLED" ||
      order.status === "REFUNDED" ||
      order.status === "PARTIALLY_REFUNDED" ||
      order.paymentStatus === "REFUNDED" ||
      order.paymentStatus === "PARTIALLY_REFUNDED"
  ).length;
  const inventoryMovements = data.inventoryMovements.filter((movement) => {
    const millis = toSortableMillis(movement.createdAt);
    return millis >= thirtyDaysAgo && millis <= now;
  });
  const saleMovements = inventoryMovements.filter((movement) =>
    ["ONLINE_SALE", "POS_SALE", "ADMIN_CREATED_SALE", "BUNDLE_CONSUMED"].includes(movement.type)
  );

  return (
    <div className="reports-workspace">
      <div className="page-heading reports-heading">
        <div>
          <p className="money-kicker">Business intelligence</p>
          <h1 className="app-title">Reports</h1>
          <p className="app-subtitle">
            Decision-ready sales, product, channel, POS, and inventory reporting across every order source.
          </p>
        </div>
        <Link className="admin-action ghost" href={"/admin/financial" as Route}>
          Financial workspace
        </Link>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}

      <section aria-label="Report metrics" className="report-metric-grid">
        <ReportMetric
          label="Revenue"
          note={formatDeltaLabel(activePeriod.revenue, previousPeriod.revenue)}
          value={formatMoney(activePeriod.revenue)}
        />
        <ReportMetric
          label="Orders"
          note={`${paidChannelTotals.find((row) => row.channel === "POS")?.orders ?? 0} POS sales`}
          tone="green"
          value={String(activePeriod.orderCount)}
        />
        <ReportMetric
          label="Average order"
          note="Basket health"
          tone="dark"
          value={formatAverageOrder(activePeriod.revenue, activePeriod.orderCount)}
        />
        <ReportMetric
          label="Discount usage"
          note={`${data.metrics.discountUsage} code use${data.metrics.discountUsage === 1 ? "" : "s"}`}
          value={String(data.metrics.discountUsage)}
        />
      </section>

      <section className="reports-panel reports-trend-panel" id="sales-report">
        <div className="reports-panel-header">
          <div>
            <h2>Sales trend</h2>
            <p>Revenue movement for the last 30 days, powered by paid orders only.</p>
          </div>
          <span>{formatMoney(activePeriod.revenue)}</span>
        </div>
        <ReportTrend points={trend} />
        <div className="report-period-strip">
          {periods.map((period) => (
            <article className="report-period-card" key={period.label}>
              <span>{period.label}</span>
              <strong>{formatMoney(period.revenue)}</strong>
              <small>{period.orderCount} paid order{period.orderCount === 1 ? "" : "s"}</small>
            </article>
          ))}
        </div>
      </section>

      <div className="reports-grid">
        <section className="reports-panel">
          <div className="reports-panel-header">
            <div>
              <h2>Top products</h2>
              <p>Revenue-ranked winners for the selected reporting period.</p>
            </div>
            <span>{activePeriod.rows.length} sold</span>
          </div>
          <div className="report-product-list">
            {activePeriod.rows.slice(0, 5).map((row) => (
              <div className="report-product-row" key={row.productId}>
                <i aria-hidden="true" />
                <div>
                  <strong>{row.title}</strong>
                  <span>
                    {row.quantitySold} sold · {row.quantityLeft} left
                  </span>
                </div>
                <em>{formatMoney(row.revenue)}</em>
              </div>
            ))}
            {activePeriod.rows.length === 0 ? <p className="admin-help">No paid orders in this period.</p> : null}
          </div>
        </section>

        <section className="reports-panel" id="pos-report">
          <div className="reports-panel-header">
            <div>
              <h2>POS &amp; channel split</h2>
              <p>Website, counter sales, and admin-created orders.</p>
            </div>
            <span>{formatMoney(posRevenue)}</span>
          </div>
          <div className="money-bars">
            {paidChannelTotals.map((row) => (
              <div className="money-bar-row" key={row.channel}>
                <div className="money-bar-label">
                  <strong>{formatChannelName(row.channel)}</strong>
                  <span>
                    {row.orders} order{row.orders === 1 ? "" : "s"} · {formatMoney(row.revenue)}
                  </span>
                </div>
                <div className="money-bar-track">
                  <span className={`money-bar-fill ${row.channel.toLowerCase()}`} style={{ width: percentWidth(row.revenue, maxChannelRevenue) }} />
                </div>
              </div>
            ))}
          </div>
          <div className="report-mini-grid">
            <div>
              <span>Open shifts</span>
              <strong>{data.metrics.activeShifts}</strong>
            </div>
            <div>
              <span>Refunds / voids</span>
              <strong>{posRefundsOrVoids}</strong>
            </div>
          </div>
        </section>
      </div>

      <div className="reports-grid">
        <section className="reports-panel" id="inventory-report">
          <div className="reports-panel-header">
            <div>
              <h2>Inventory signals</h2>
              <p>Low-stock and movement reporting tied back to sales.</p>
            </div>
            <span>{data.metrics.lowStock} low</span>
          </div>
          <div className="report-product-list">
            {lowStockRows.map(({ product, variant, availableStock }) => (
              <div className="report-product-row warn" key={variant.id}>
                <i aria-hidden="true" />
                <div>
                  <strong>{product?.title ?? "Product"} · {variant.title}</strong>
                  <span>Threshold {variant.lowStockThreshold} · {availableStock} available</span>
                </div>
                <Link className="money-row-action" href={"/admin/inventory" as Route}>
                  Restock
                </Link>
              </div>
            ))}
            {lowStockRows.length === 0 ? <p className="admin-help">No low-stock variants right now.</p> : null}
          </div>
          <div className="report-mini-grid">
            <div>
              <span>Movements</span>
              <strong>{inventoryMovements.length}</strong>
            </div>
            <div>
              <span>Sale draws</span>
              <strong>{saleMovements.length}</strong>
            </div>
          </div>
        </section>

        <section className="reports-panel">
          <div className="reports-panel-header">
            <div>
              <h2>Report packs</h2>
              <p>Owner-friendly summaries grouped by how the business is run.</p>
            </div>
            <span>Export-ready</span>
          </div>
          <div className="report-pack-list">
            <Link className="report-pack-card" href={"#sales-report" as Route}>
              <strong>Owner weekly pack</strong>
              <span>Sales, channels, product ranking, discount usage, and low-stock warnings.</span>
            </Link>
            <Link className="report-pack-card" href={"#pos-report" as Route}>
              <strong>POS shift pack</strong>
              <span>Cash sales, open shifts, refunds, voids, and manager-sensitive review points.</span>
            </Link>
            <Link className="report-pack-card" href={"#inventory-report" as Route}>
              <strong>Inventory movement pack</strong>
              <span>Sold, restocked, adjusted, damaged, returned, and current stock position.</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
