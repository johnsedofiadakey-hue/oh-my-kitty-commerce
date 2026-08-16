import { formatMoney, getAdminOperationsData } from "@/lib/admin/operations-data";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryPage() {
  const data = await getAdminOperationsData();

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Delivery</h1>
          <p className="app-subtitle">Pickup, local delivery, fees, regions, and customer-facing estimates.</p>
        </div>
        <button className="admin-action" type="button">
          New rule
        </button>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Delivery rules</h2>
          <span>{data.deliveryRules.length} options</span>
        </div>
        <div className="admin-table">
          <div className="admin-table-row header">
            <span>Name</span>
            <span>Type</span>
            <span>Regions</span>
            <span>Fee</span>
            <span>Estimate</span>
          </div>
          {data.deliveryRules.map((rule) => (
            <div className="admin-table-row" key={rule.id}>
              <strong>{rule.name}</strong>
              <span>{rule.type.replaceAll("_", " ")}</span>
              <span>{rule.regions.join(", ") || "All"}</span>
              <span>{formatMoney(rule.fee)}</span>
              <span>{rule.estimate ?? "Not set"}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
