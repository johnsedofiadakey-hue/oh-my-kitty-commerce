import { getAdminOperationsData } from "@/lib/admin/operations-data";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { CreateDeliveryRuleForm } from "@/components/admin/delivery-rule-form";
import { DeliveryRuleRow } from "@/components/admin/delivery-rule-row";
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
            <DeliveryRuleRow
              active={rule.active}
              disabled={disabled}
              estimate={rule.estimate}
              fee={rule.fee}
              id={rule.id}
              key={rule.id}
              name={rule.name}
              quickEditDeliveryRuleAction={quickEditDeliveryRuleAction}
              regions={rule.regions}
              sortOrder={rule.sortOrder}
              type={rule.type}
            />
          ))}
          {data.deliveryRules.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
        </div>
      </section>
    </>
  );
}
