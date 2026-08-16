import { getAdminOperationsData } from "@/lib/admin/operations-data";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const data = await getAdminOperationsData();

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Promotions</h1>
          <p className="app-subtitle">Discount rules, limits, channel restrictions, and approval flags.</p>
        </div>
        <button className="admin-action" type="button">
          New promotion
        </button>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Discount codes</h2>
          <span>{data.promotions.length} active rule</span>
        </div>
        <div className="admin-table">
          <div className="admin-table-row header">
            <span>Code</span>
            <span>Type</span>
            <span>Value</span>
            <span>Channels</span>
            <span>Approval</span>
          </div>
          {data.promotions.map((promotion) => (
            <div className="admin-table-row" key={promotion.id}>
              <strong>{promotion.code}</strong>
              <span>{promotion.type}</span>
              <span>{promotion.type === "PERCENT" ? `${promotion.value}%` : promotion.value}</span>
              <span>{promotion.channelRestrictions.join(", ") || "All"}</span>
              <span>{promotion.requiresManagerApproval ? "Required" : "Not required"}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
