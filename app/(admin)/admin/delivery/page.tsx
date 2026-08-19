import { getAdminOperationsData } from "@/lib/admin/operations-data";
import { AdminDrawer } from "@/components/admin/admin-drawer";
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
        <AdminDrawer title="New delivery rule" triggerLabel="New rule">
          <CreateDeliveryRuleForm action={createDeliveryRuleAction} disabled={disabled} />
        </AdminDrawer>
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
          {data.deliveryRules.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
        </div>
      </section>
    </>
  );
}
