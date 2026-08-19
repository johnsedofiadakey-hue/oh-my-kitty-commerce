import { getAdminTaxonomyData } from "@/lib/admin/taxonomy";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { TaxonomyManagementForms } from "@/components/admin/taxonomy-management-forms";
import { requireAdminPermission } from "@/lib/auth/server";
import type { Concern, ProductType, Routine } from "@/lib/commerce/types";
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
  action: (formData: FormData) => Promise<void>;
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
          <form action={action} className="quick-edit-row" key={entry.id}>
            <input name="id" type="hidden" value={entry.id} />
            <label className="admin-field">
              <span>Title</span>
              <input defaultValue={entry.title} disabled={disabled} name="title" required />
            </label>
            <label className="admin-field">
              <span>Slug</span>
              <input disabled value={entry.slug} />
            </label>
            <label className="admin-field">
              <span>Sort order</span>
              <input
                defaultValue={entry.sortOrder}
                disabled={disabled}
                inputMode="numeric"
                min="0"
                name="sortOrder"
              />
            </label>
            <label className="admin-field checkbox">
              <input defaultChecked={entry.active} disabled={disabled} name="active" type="checkbox" />
              <span>Active</span>
            </label>
            <button className="admin-action" disabled={disabled} type="submit">
              Save
            </button>
          </form>
        ))}
        {entries.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
      </div>
    </section>
  );
}
