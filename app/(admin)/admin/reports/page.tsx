import {
  formatMoney,
  getAdminOperationsData
} from "@/lib/admin/operations-data";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const data = await getAdminOperationsData();
  const lowStockRows = data.inventoryRows.filter((row) => row.lowStock);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Reports</h1>
          <p className="app-subtitle">Revenue, channel totals, POS cash, stock alerts, and staff activity.</p>
        </div>
        <button className="admin-action" type="button">
          Export
        </button>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      <section className="metric-grid">
        <article className="metric">
          <span>Cash sales</span>
          <strong>{formatMoney(data.metrics.cashSales)}</strong>
        </article>
        <article className="metric">
          <span>Active shifts</span>
          <strong>{data.metrics.activeShifts}</strong>
        </article>
        <article className="metric">
          <span>Low stock</span>
          <strong>{lowStockRows.length}</strong>
        </article>
        <article className="metric">
          <span>Discount usage</span>
          <strong>{data.metrics.discountUsage}</strong>
        </article>
      </section>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Channel split</h2>
          <span>Revenue by source</span>
        </div>
        <div className="admin-table three">
          <div className="admin-table-row header">
            <span>Channel</span>
            <span>Orders</span>
            <span>Revenue</span>
          </div>
          {data.channelTotals.map((row) => (
            <div className="admin-table-row" key={row.channel}>
              <strong>{row.channel.replace("_", " ")}</strong>
              <span>{row.orders}</span>
              <span>{formatMoney(row.revenue)}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
