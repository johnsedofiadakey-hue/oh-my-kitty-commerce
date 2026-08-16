import {
  formatMoney,
  getAdminMetrics,
  getChannelTotals,
  getOrderRows
} from "@/lib/admin/sample-admin-data";

const metrics = [
  ["Revenue", formatMoney(getAdminMetrics().revenue)],
  ["Online orders", String(getAdminMetrics().onlineOrders)],
  ["POS sales", String(getAdminMetrics().posOrders)],
  ["Low stock", String(getAdminMetrics().lowStock)]
] as const;

export default function AdminDashboardPage() {
  const recentOrders = getOrderRows().slice(0, 5);
  const channelTotals = getChannelTotals();

  return (
    <>
      <h1 className="app-title">Store operations</h1>
      <p className="app-subtitle">
        Today&apos;s store activity, order flow, channel totals, and inventory alerts.
      </p>
      <section className="metric-grid" aria-label="Admin metrics">
        {metrics.map(([label, value]) => (
          <article className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
      <section className="admin-grid two" aria-label="Operational summary">
        <div className="admin-panel">
          <div className="panel-header">
            <h2>Channel totals</h2>
            <span>Orders and revenue</span>
          </div>
          <div className="stack-list">
            {channelTotals.map((row) => (
              <div className="stack-row" key={row.channel}>
                <strong>{row.channel.replace("_", " ")}</strong>
                <span>
                  {row.orders} orders / {formatMoney(row.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-panel">
          <div className="panel-header">
            <h2>Recent orders</h2>
            <span>Latest activity</span>
          </div>
          <div className="stack-list">
            {recentOrders.map(({ order }) => (
              <div className="stack-row" key={order.id}>
                <strong>{order.orderNumber}</strong>
                <span>
                  {order.channel} / {order.paymentStatus} / {formatMoney(order.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
