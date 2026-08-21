import {
  formatMoney,
  getAdminOperationsData
} from "@/lib/admin/operations-data";
import { requireAdminPermission } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireAdminPermission("reports.view");
  const data = await getAdminOperationsData();

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Reports</h1>
          <p className="app-subtitle">Best sellers and promo-code usage, all time. For today at a glance, see the Dashboard.</p>
        </div>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      <section className="metric-grid">
        <article className="metric">
          <span>Discount usage</span>
          <strong>{data.metrics.discountUsage}</strong>
        </article>
      </section>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Top products</h2>
          <span>By revenue, paid orders</span>
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
    </>
  );
}
