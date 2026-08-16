import {
  formatMoney,
  getAdminOperationsData
} from "@/lib/admin/operations-data";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await getAdminOperationsData();
  const recentOrders = data.orderRows.slice(0, 5);
  const metrics = [
    ["Revenue", formatMoney(data.metrics.revenue)],
    ["Online orders", String(data.metrics.onlineOrders)],
    ["POS sales", String(data.metrics.posOrders)],
    ["Low stock", String(data.metrics.lowStock)]
  ] as const;


  return (
    <>
      <h1 className="app-title">Store operations</h1>
      <p className="app-subtitle">
        Today&apos;s store activity, order flow, channel totals, and inventory alerts.
      </p>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
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
            {data.channelTotals.map((row) => (
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
