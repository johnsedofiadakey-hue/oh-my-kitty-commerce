import { formatMoney, getAdminOperationsData } from "@/lib/admin/operations-data";
import { CreateDeliveryRuleForm } from "@/components/admin/delivery-rule-form";
import { requireAdminPermission } from "@/lib/auth/server";
import { createDeliveryRuleAction, quickEditDeliveryRuleAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryPage() {
  await requireAdminPermission("settings.view");
  const data = await getAdminOperationsData();
  const disabled = data.source !== "live";

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Delivery</h1>
          <p className="app-subtitle">Pickup, local delivery, fees, regions, and customer-facing estimates.</p>
        </div>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      <CreateDeliveryRuleForm action={createDeliveryRuleAction} disabled={disabled} />
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Delivery rules</h2>
          <span>{data.deliveryRules.length} options</span>
        </div>
        <div className="quick-edit-list">
          {data.deliveryRules.map((rule) => (
            <form action={quickEditDeliveryRuleAction} className="quick-edit-row" key={rule.id}>
              <input name="id" type="hidden" value={rule.id} />
              <label className="admin-field">
                <span>Name</span>
                <input defaultValue={rule.name} disabled={disabled} name="name" required />
              </label>
              <label className="admin-field">
                <span>Type</span>
                <input disabled value={rule.type.replaceAll("_", " ")} />
              </label>
              <label className="admin-field">
                <span>Regions</span>
                <input disabled value={rule.regions.join(", ") || "All"} />
              </label>
              <label className="admin-field">
                <span>Fee GHS</span>
                <input
                  defaultValue={(rule.fee / 100).toFixed(2)}
                  disabled={disabled}
                  inputMode="decimal"
                  min="0"
                  name="fee"
                  required
                />
              </label>
              <label className="admin-field">
                <span>Estimate</span>
                <input defaultValue={rule.estimate ?? ""} disabled={disabled} name="estimate" />
              </label>
              <label className="admin-field">
                <span>Sort order</span>
                <input
                  defaultValue={rule.sortOrder}
                  disabled={disabled}
                  inputMode="numeric"
                  min="0"
                  name="sortOrder"
                />
              </label>
              <label className="admin-field checkbox">
                <input defaultChecked={rule.active} disabled={disabled} name="active" type="checkbox" />
                <span>Active</span>
              </label>
              <button className="admin-action" disabled={disabled} type="submit">
                Save
              </button>
            </form>
          ))}
        </div>
      </section>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Reference</h2>
          <span>All fees shown</span>
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
