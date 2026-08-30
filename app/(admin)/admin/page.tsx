import Image from "next/image";
import Link from "next/link";
import { AdminIcon } from "@/components/admin/admin-icons";
import {
  daysSince,
  formatDate,
  formatMoney,
  getAdminOperationsData,
  getOrderCustomerName
} from "@/lib/admin/operations-data";
import { formatFulfilmentStatus } from "@/lib/commerce/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await getAdminOperationsData();
  const recentOrders = data.orderRows.slice(0, 5);

  const stuckOrders = data.orderRows
    .filter(
      ({ order }) =>
        order.status !== "CANCELLED" &&
        (order.fulfilmentStatus === "UNFULFILLED" || order.fulfilmentStatus === "PROCESSING")
    )
    .sort((a, b) => (daysSince(b.order.createdAt) ?? 0) - (daysSince(a.order.createdAt) ?? 0))
    .slice(0, 3);

  const lowStockRows = data.inventoryRows.filter((row) => row.lowStock).slice(0, Math.max(0, 5 - stuckOrders.length));
  const attentionCount = stuckOrders.length + lowStockRows.length;

  const maxChannelRevenue = Math.max(1, ...data.channelTotals.map((row) => row.revenue));

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Store operations</h1>
          <p className="app-subtitle">
            What needs a decision today, and how the store is trending across channels.
          </p>
        </div>
        <Link className="admin-action ghost" href="/admin/reports">
          <AdminIcon name="reports" />
          Full report
        </Link>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}

      <section aria-label="Store metrics" className="kpi-row">
        <article className="kpi-card">
          <div className="kpi-card-top">
            <span>Revenue</span>
            <span className="kpi-icon accent">
              <AdminIcon name="orders" />
            </span>
          </div>
          <strong>{formatMoney(data.metrics.revenue)}</strong>
          <span className="kpi-sub">From {data.orders.length} order{data.orders.length === 1 ? "" : "s"}</span>
        </article>
        <article className="kpi-card">
          <div className="kpi-card-top">
            <span>Orders</span>
            <span className="kpi-icon accent">
              <AdminIcon name="overview" />
            </span>
          </div>
          <strong>{data.orders.length}</strong>
          <span className="kpi-sub">
            {data.metrics.onlineOrders} online &middot; {data.metrics.posOrders} POS
          </span>
        </article>
        <article className="kpi-card">
          <div className="kpi-card-top">
            <span>POS cash sales</span>
            <span className="kpi-icon good">
              <AdminIcon name="inventory" />
            </span>
          </div>
          <strong>{formatMoney(data.metrics.cashSales)}</strong>
          <span className="kpi-sub">{data.metrics.activeShifts} active shift{data.metrics.activeShifts === 1 ? "" : "s"}</span>
        </article>
        <article className="kpi-card">
          <div className="kpi-card-top">
            <span>Low stock</span>
            <span className={data.metrics.lowStock > 0 ? "kpi-icon warn" : "kpi-icon good"}>
              <AdminIcon name="alert" />
            </span>
          </div>
          <strong>{data.metrics.lowStock}</strong>
          <span className={data.metrics.lowStock > 0 ? "kpi-sub warn" : "kpi-sub"}>
            {data.metrics.lowStock > 0 ? "Needs a restock order" : "All variants healthy"}
          </span>
        </article>
      </section>

      <section className="dash-grid">
        <div className="admin-panel no-margin">
          <div className="panel-header">
            <div>
              <h2>Recent orders</h2>
              <span>Latest activity across every channel</span>
            </div>
            <Link className="panel-link" href="/admin/orders">
              View all
            </Link>
          </div>
          <div className="admin-table five">
            <div className="admin-table-row header">
              <span>Order</span>
              <span>Customer</span>
              <span>Channel</span>
              <span>Fulfilment</span>
              <span>Total</span>
            </div>
            {recentOrders.map(({ order }) => (
              <div className="admin-table-row" key={order.id}>
                <div className="table-cell-with-thumb">
                  <div className="order-thumb small" aria-hidden="true">
                    {order.items[0]?.mediaUrl ? (
                      <Image alt="" fill sizes="32px" src={order.items[0].mediaUrl} />
                    ) : (
                      <span className="order-thumb-empty" />
                    )}
                  </div>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <div className="table-subline">{order.createdAt ? formatDate(order.createdAt) : "Date not recorded"}</div>
                  </div>
                </div>
                <span>{getOrderCustomerName(order)}</span>
                <span className="status neutral">{order.channel.replace("_", " ")}</span>
                <span className={fulfilmentStatusClass(order.fulfilmentStatus)}>
                  {formatFulfilmentStatus(order.fulfilmentStatus)}
                </span>
                <span>{formatMoney(order.total)}</span>
              </div>
            ))}
            {recentOrders.length === 0 ? <p className="admin-help">No orders yet.</p> : null}
          </div>
        </div>

        <div className="dash-side">
          <div className="admin-panel no-margin">
            <div className="panel-header">
              <div>
                <h2>Needs attention</h2>
                <span>{attentionCount} item{attentionCount === 1 ? "" : "s"}</span>
              </div>
            </div>
            <div className="attention-list">
              {stuckOrders.map(({ order }) => {
                const age = daysSince(order.createdAt);
                return (
                  <div className="attention-row" key={order.id}>
                    <span className="attention-stripe urgent" />
                    <div className="attention-body">
                      <strong>
                        {order.orderNumber} &mdash; {formatFulfilmentStatus(order.fulfilmentStatus).toLowerCase()}
                      </strong>
                      <span>{age !== null ? `No update in ${age} day${age === 1 ? "" : "s"}` : "Awaiting fulfilment"}</span>
                    </div>
                    <Link className="attention-action" href="/admin/orders">
                      Open
                    </Link>
                  </div>
                );
              })}
              {lowStockRows.map(({ product, variant }) => (
                <div className="attention-row" key={variant.id}>
                  <span className="attention-stripe warn" />
                  <div className="attention-body">
                    <strong>
                      {product?.title ?? "Product"} &mdash; {variant.stockAvailable} left
                    </strong>
                    <span>Below threshold of {variant.lowStockThreshold}</span>
                  </div>
                  <Link className="attention-action" href="/admin/inventory">
                    Restock
                  </Link>
                </div>
              ))}
              {attentionCount === 0 ? (
                <div className="attention-empty">Nothing needs a decision right now.</div>
              ) : null}
            </div>
          </div>

          <div className="admin-panel no-margin">
            <div className="panel-header">
              <div>
                <h2>Channel split</h2>
                <span>Orders and revenue</span>
              </div>
            </div>
            <div className="split-bars">
              {data.channelTotals.map((row) => (
                <div className="split-row" key={row.channel}>
                  <div className="split-top">
                    <strong>{row.channel.replace("_", " ")}</strong>
                    <span>
                      {row.orders} order{row.orders === 1 ? "" : "s"} &middot; {formatMoney(row.revenue)}
                    </span>
                  </div>
                  <div className="split-track">
                    <div
                      className={`split-fill ${row.channel.toLowerCase()}`}
                      style={{ width: `${Math.max(3, (row.revenue / maxChannelRevenue) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function fulfilmentStatusClass(status: string) {
  if (status === "FULFILLED") {
    return "status";
  }

  if (status === "CANCELLED") {
    return "status neutral";
  }

  if (status === "UNFULFILLED") {
    return "status warn";
  }

  return "status warn";
}
