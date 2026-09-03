import { getAdminTaxonomyData } from "@/lib/admin/taxonomy";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { TaxonomyManagementForms } from "@/components/admin/taxonomy-management-forms";
import { TaxonomyRow } from "@/components/admin/taxonomy-row";
import { requireAdminPermission } from "@/lib/auth/server";
import type { Concern, ProductType, Routine } from "@/lib/commerce/types";
import type { AdminFormAction } from "@/lib/admin/product-form";
import {
  createConcernAction,
  createProductTypeAction,
  createRoutineAction,
  quickEditConcernAction,
  quickEditProductTypeAction,
  quickEditRoutineAction
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminTaxonomyPage() {
  await requireAdminPermission("products.view");
  const data = await getAdminTaxonomyData();
  const disabled = data.source !== "live";

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Taxonomy</h1>
          <p className="app-subtitle">
            Concerns, product types, and routines customers use to browse the shop.
          </p>
        </div>
        <AdminDrawer title="New taxonomy entry" triggerLabel="New entry">
          <TaxonomyManagementForms
            createConcernAction={createConcernAction}
            createProductTypeAction={createProductTypeAction}
            createRoutineAction={createRoutineAction}
            disabled={disabled}
          />
        </AdminDrawer>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      <TaxonomyTable
        action={quickEditConcernAction}
        disabled={disabled}
        entries={data.concerns}
        subtitle="Shop by Need"
        title="Concerns"
      />
      <TaxonomyTable
        action={quickEditProductTypeAction}
        disabled={disabled}
        entries={data.productTypes}
        subtitle="Shop by Product"
        title="Product types"
      />
      <TaxonomyTable
        action={quickEditRoutineAction}
        disabled={disabled}
        entries={data.routines}
        subtitle="Shop by Routine"
        title="Routines"
      />
    </>
  );
}

function TaxonomyTable({
  action,
  disabled,
  entries,
  subtitle,
  title
}: {
  action: AdminFormAction;
  disabled: boolean;
  entries: (Concern | ProductType | Routine)[];
  subtitle: string;
  title: string;
}) {
  return (
    <section className="admin-panel">
      <div className="panel-header">
        <h2>{title}</h2>
        <span>{subtitle}</span>
      </div>
      <div className="quick-edit-list">
        {entries.map((entry) => (
          <TaxonomyRow
            action={action}
            active={entry.active}
            disabled={disabled}
            id={entry.id}
            key={entry.id}
            slug={entry.slug}
            sortOrder={entry.sortOrder}
            title={entry.title}
          />
        ))}
        {entries.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
      </div>
    </section>
  );
}
