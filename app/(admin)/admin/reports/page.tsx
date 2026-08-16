import {
  adminData,
  formatMoney,
  getChannelTotals,
  getInventoryRows
} from "@/lib/admin/sample-admin-data";

export default function AdminReportsPage() {
  const channelTotals = getChannelTotals();
  const lowStockRows = getInventoryRows().filter((row) => row.lowStock);
  const cashSales = adminData.payments
    .filter((payment) => payment.method === "cash")
    .reduce((total, payment) => total + payment.amount, 0);

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
      <section className="metric-grid">
        <article className="metric">
          <span>Cash sales</span>
          <strong>{formatMoney(cashSales)}</strong>
        </article>
        <article className="metric">
          <span>Active shifts</span>
          <strong>{adminData.posShifts.filter((shift) => shift.status === "OPEN").length}</strong>
        </article>
        <article className="metric">
          <span>Low stock</span>
          <strong>{lowStockRows.length}</strong>
        </article>
        <article className="metric">
          <span>Discount usage</span>
          <strong>{adminData.promotions.reduce((total, promo) => total + promo.usedCount, 0)}</strong>
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
          {channelTotals.map((row) => (
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
