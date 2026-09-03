import { getAdminOperationsData } from "@/lib/admin/operations-data";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { CreatePromotionForm } from "@/components/admin/promotion-form";
import { PromotionRow } from "@/components/admin/promotion-row";
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
            <PromotionRow
              active={promotion.active}
              channelRestrictions={promotion.channelRestrictions}
              code={promotion.code}
              disabled={disabled}
              id={promotion.id}
              key={promotion.id}
              requiresManagerApproval={promotion.requiresManagerApproval}
              type={promotion.type}
              updatePromotionAction={updatePromotionAction}
              value={promotion.value}
            />
          ))}
          {data.promotions.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
        </div>
      </section>
    </>
  );
}
