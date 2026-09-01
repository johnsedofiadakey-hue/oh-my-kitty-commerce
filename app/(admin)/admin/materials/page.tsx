import { getAdminCatalogueData } from "@/lib/admin/catalogue";
import { formatMoney } from "@/lib/commerce/format";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { MaterialManagementForm } from "@/components/admin/material-management-form";
import { DeleteMaterialButton } from "@/components/admin/delete-material-button";
import { requireAdminPermission } from "@/lib/auth/server";
import { createRawMaterialAction, deleteRawMaterialAction, updateRawMaterialAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminMaterialsPage() {
  await requireAdminPermission("reports.financial");
  const rawCatalogue = await getAdminCatalogueData();
  const disabled = rawCatalogue.source !== "live";
  // Firestore's Timestamp is a class instance, not a plain object — React
  // Server Components can't pass it across the boundary into the client
  // material form below, so strip it down to plain data first.
  const materials = [...rawCatalogue.rawMaterials]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((material) => JSON.parse(JSON.stringify(material)) as typeof material);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Raw Materials</h1>
          <p className="app-subtitle">
            Ingredients and packaging, priced per unit. Add them to a product&apos;s recipe (Products &rarr;
            Edit) to have its cost calculated automatically instead of entered by hand.
          </p>
        </div>
        <AdminDrawer title="New material" triggerLabel="New material">
          <MaterialManagementForm action={createRawMaterialAction} disabled={disabled} />
        </AdminDrawer>
      </div>
      {rawCatalogue.sourceMessage ? (
        <div className="admin-alert" role="status">
          {rawCatalogue.sourceMessage}
        </div>
      ) : null}
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Materials</h2>
          <span>{materials.length} tracked</span>
        </div>
        <div className="stack-list">
          {materials.map((material) => (
            <div className="stack-row" key={material.id}>
              <strong>{material.name}</strong>
              <span>
                {formatMoney(material.costPerUnit)} / {material.unit}
              </span>
              {material.supplier ? <span>{material.supplier}</span> : null}
              <div className="stack-row-actions">
                <AdminDrawer
                  title={`Edit ${material.name}`}
                  triggerClassName="admin-action ghost small"
                  triggerLabel="Edit"
                >
                  <MaterialManagementForm action={updateRawMaterialAction} disabled={disabled} material={material} />
                </AdminDrawer>
                <DeleteMaterialButton
                  action={deleteRawMaterialAction}
                  disabled={disabled}
                  materialId={material.id}
                  materialName={material.name}
                />
              </div>
            </div>
          ))}
          {materials.length === 0 ? (
            <p className="admin-help">No raw materials yet — add one to start building product recipes.</p>
          ) : null}
        </div>
      </section>
    </>
  );
}
