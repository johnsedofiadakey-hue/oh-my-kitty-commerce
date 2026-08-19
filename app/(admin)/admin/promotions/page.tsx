import { getAdminOperationsData } from "@/lib/admin/operations-data";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { CreatePromotionForm } from "@/components/admin/promotion-form";
import { requireAdminPermission } from "@/lib/auth/server";
import { createPromotionAction, updatePromotionAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  await requireAdminPermission("promotions.view");
  const data = await getAdminOperationsData();
  const disabled = data.source !== "live";

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Promotions</h1>
          <p className="app-subtitle">Discount rules, limits, channel restrictions, and approval flags.</p>
        </div>
        <AdminDrawer title="New promotion" triggerLabel="New promotion">
          <CreatePromotionForm action={createPromotionAction} disabled={disabled} />
        </AdminDrawer>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Discount codes</h2>
          <span>{data.promotions.length} rules</span>
        </div>
        <div className="quick-edit-list">
          {data.promotions.map((promotion) => (
            <form action={updatePromotionAction} className="quick-edit-row" key={promotion.id}>
              <input name="id" type="hidden" value={promotion.id} />
              <label className="admin-field">
                <span>Code</span>
                <input disabled value={promotion.code} />
              </label>
              <label className="admin-field">
                <span>Channels</span>
                <input disabled value={promotion.channelRestrictions.join(", ") || "All"} />
              </label>
              <label className="admin-field">
                <span>Value {promotion.type === "PERCENT" ? "(%)" : "(GHS)"}</span>
                <input
                  defaultValue={promotion.value}
                  disabled={disabled}
                  inputMode="decimal"
                  min="0"
                  name="value"
                  required
                />
              </label>
              <label className="admin-field checkbox">
                <input defaultChecked={promotion.active} disabled={disabled} name="active" type="checkbox" />
                <span>Active</span>
              </label>
              <label className="admin-field checkbox">
                <input
                  defaultChecked={promotion.requiresManagerApproval}
                  disabled={disabled}
                  name="requiresManagerApproval"
                  type="checkbox"
                />
                <span>Requires approval</span>
              </label>
              <button className="admin-action" disabled={disabled} type="submit">
                Save
              </button>
            </form>
          ))}
          {data.promotions.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
        </div>
      </section>
    </>
  );
}
