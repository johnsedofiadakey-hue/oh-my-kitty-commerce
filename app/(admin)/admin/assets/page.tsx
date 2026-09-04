import { getAdminFinancialData } from "@/lib/admin/financial-data";
import { requireAdminPermission } from "@/lib/auth/server";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { AssetRow, CreateAssetForm } from "@/components/admin/asset-forms";
import { formatMoney } from "@/lib/commerce/format";
import { computeAssetBookValue } from "@/lib/commerce/depreciation";
import { createCapitalAssetAction, deleteCapitalAssetAction, updateCapitalAssetAction } from "./actions";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  EQUIPMENT: "Equipment",
  FURNITURE: "Furniture",
  MACHINE: "Machine",
  PROPERTY: "Property",
  OTHER: "Other"
};

function formatDateLabel(value: Date) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function toDateInputValue(value: Date) {
  return new Date(value).toISOString().slice(0, 10);
}

export default async function AdminAssetsPage() {
  await requireAdminPermission("assets.view");
  const data = await getAdminFinancialData();
  const disabled = data.source !== "live";

  const totalPurchaseCost = data.capitalAssets.reduce((total, asset) => total + asset.purchaseCost, 0);
  const totalBookValue = data.capitalAssets.reduce((total, asset) => total + computeAssetBookValue(asset), 0);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Assets</h1>
          <p className="app-subtitle">Equipment, furniture, machines, and everything else the business owns.</p>
        </div>
        <AdminDrawer title="Add an asset" triggerLabel="Add asset">
          <CreateAssetForm action={createCapitalAssetAction} disabled={disabled} />
        </AdminDrawer>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}

      <section className="admin-panel">
        <div className="panel-header">
          <h2>Overview</h2>
          <span>{data.capitalAssets.length} assets</span>
        </div>
        <div className="metric-grid">
          <article className="metric">
            <span>Total purchase cost</span>
            <strong>{formatMoney(totalPurchaseCost)}</strong>
          </article>
          <article className="metric">
            <span>Current book value</span>
            <strong>{formatMoney(totalBookValue)}</strong>
          </article>
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-header">
          <h2>Register</h2>
          <span>Tap one to edit or remove it</span>
        </div>
        <div className="order-list">
          {data.capitalAssets.map((asset) => {
            const bookValue = computeAssetBookValue(asset);
            return (
              <AssetRow
                assetId={asset.id}
                bookValueLabel={asset.trackDepreciation ? formatMoney(bookValue) : null}
                category={asset.category}
                categoryLabel={CATEGORY_LABELS[asset.category] ?? asset.category}
                deleteAction={deleteCapitalAssetAction}
                disabled={disabled}
                key={asset.id}
                location={asset.location}
                name={asset.name}
                notes={asset.notes}
                purchaseCostLabel={formatMoney(asset.purchaseCost)}
                purchaseCostValue={(asset.purchaseCost / 100).toFixed(2)}
                purchaseDateLabel={formatDateLabel(asset.purchaseDate)}
                purchaseDateValue={toDateInputValue(asset.purchaseDate)}
                trackDepreciation={asset.trackDepreciation}
                updateAction={updateCapitalAssetAction}
                usefulLifeYears={asset.usefulLifeYears ?? null}
              />
            );
          })}
          {data.capitalAssets.length === 0 ? <p className="admin-help">Nothing added yet.</p> : null}
        </div>
      </section>
    </>
  );
}
