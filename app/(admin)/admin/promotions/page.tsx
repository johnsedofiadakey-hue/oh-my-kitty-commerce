import { adminData } from "@/lib/admin/sample-admin-data";

export default function AdminPromotionsPage() {
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
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Discount codes</h2>
          <span>{adminData.promotions.length} active rule</span>
        </div>
        <div className="admin-table">
          <div className="admin-table-row header">
            <span>Code</span>
            <span>Type</span>
            <span>Value</span>
            <span>Channels</span>
            <span>Approval</span>
          </div>
          {adminData.promotions.map((promotion) => (
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
