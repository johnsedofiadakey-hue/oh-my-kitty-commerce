import { getAdminCatalogueData } from "@/lib/admin/catalogue";
import { getAdminFinancialData } from "@/lib/admin/financial-data";
import { formatMoney } from "@/lib/commerce/format";
import { toRealDate } from "@/lib/admin/operations-data";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { AdminTabs, type AdminTabSpec } from "@/components/admin/admin-tabs";
import { MaterialManagementForm } from "@/components/admin/material-management-form";
import { MaterialPurchaseForm } from "@/components/admin/material-purchase-form";
import { ProductionRunForm, type ProducibleVariant } from "@/components/admin/production-run-form";
import { RecipeEditor, type RecipeMaterial } from "@/components/admin/recipe-editor";
import { DeleteMaterialButton } from "@/components/admin/delete-material-button";
import { requireAdminPermission } from "@/lib/auth/server";
import {
  createMaterialPurchaseAction,
  createRawMaterialAction,
  deleteRawMaterialAction,
  recordProductionRunAction,
  updateRawMaterialAction,
  updateRecipeAction
} from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

function formatQuantity(value: number) {
  return Number.parseFloat(value.toFixed(3)).toLocaleString("en-US");
}

function formatDateLabel(value: Date | undefined) {
  const date = toRealDate(value);
  return date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

export default async function AdminMaterialsPage({ searchParams }: PageProps) {
  await requireAdminPermission("reports.financial");
  const { tab } = await searchParams;

  const context = getCommerceServerContext();
  const [rawCatalogue, financial, purchases, runs] = await Promise.all([
    getAdminCatalogueData(),
    getAdminFinancialData(),
    context ? context.repo.listMaterialPurchases().catch(() => []) : Promise.resolve([]),
    context ? context.repo.listProductionRuns().catch(() => []) : Promise.resolve([])
  ]);
  const disabled = rawCatalogue.source !== "live";

  // Firestore's Timestamp is a class instance, not a plain object — React
  // Server Components can't pass it across the boundary into the client
  // forms below, so strip everything down to plain data first.
  const materials = [...rawCatalogue.rawMaterials]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((material) => ({
      id: material.id,
      name: material.name,
      unit: material.unit,
      kind: material.kind ?? ("INGREDIENT" as const),
      costPerUnit: material.costPerUnit,
      stockOnHand: material.stockOnHand ?? 0,
      lowStockThreshold: material.lowStockThreshold ?? 0,
      supplier: material.supplier
    }));
  const materialsById = new Map(materials.map((material) => [material.id, material]));
  const lowStock = materials.filter(
    (material) => material.lowStockThreshold > 0 && material.stockOnHand <= material.lowStockThreshold
  );
  const stockValue = materials.reduce(
    (total, material) => total + Math.round(material.costPerUnit * Math.max(0, material.stockOnHand)),
    0
  );

  const expenseCategories = financial.expenseCategories
    .filter((category) => category.active)
    .map((category) => ({ id: category.id, title: category.title }));

  // A variant can be produced when it has a recipe of its own. Sets are built
  // from other products, so they're deliberately excluded.
  const recipeMaterials: RecipeMaterial[] = materials.map((material) => ({
    id: material.id,
    name: material.name,
    unit: material.unit,
    kind: material.kind,
    costPerUnit: material.costPerUnit
  }));

  const recipeTargets = rawCatalogue.variants
    .filter((variant) => !variant.bundleComponents || variant.bundleComponents.length === 0)
    .map((variant) => {
      const product = rawCatalogue.products.find((entry) => entry.id === variant.productId);
      return {
        productId: variant.productId,
        variantId: variant.id,
        productTitle: product?.title ?? "Product",
        label: `${product?.title ?? "Product"} — ${variant.title}`,
        price: variant.price,
        cost: variant.cost ?? 0,
        stockOnHand: variant.stockOnHand,
        recipe: variant.recipe ?? []
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  const producible: ProducibleVariant[] = recipeTargets
    .filter((target) => target.recipe.length > 0)
    .map((target) => ({
      productId: target.productId,
      variantId: target.variantId,
      label: target.label,
      unitCost: target.cost,
      stockOnHand: target.stockOnHand,
      lines: target.recipe.flatMap((item) => {
        const material = materialsById.get(item.materialId);
        if (!material) {
          return [];
        }
        return [
          {
            materialId: material.id,
            materialName: material.name,
            unit: material.unit,
            kind: material.kind,
            quantityPerUnit: item.quantityPerUnit,
            unitCost: material.costPerUnit,
            stockOnHand: material.stockOnHand
          }
        ];
      })
    }));

  const materialsTab = (
    <>
      {lowStock.length > 0 ? (
        <div className="admin-alert" role="status">
          Running low: {lowStock.map((material) => material.name).join(", ")}.
        </div>
      ) : null}

      <section className="admin-panel">
        <div className="panel-header">
          <h2>Materials</h2>
          <span>
            {materials.length} tracked · {formatMoney(stockValue)} of stock on hand
          </span>
        </div>
        <div className="admin-panel-footer-row">
          <span className="admin-help">
            Everything she buys — ingredients and packaging both. Log a purchase and the cost per unit works
            itself out from what was actually paid.
          </span>
          <div className="stack-row-actions">
            {materials.length > 0 ? (
              <AdminDrawer title="Log a purchase" triggerLabel="Log purchase">
                <MaterialPurchaseForm
                  action={createMaterialPurchaseAction}
                  disabled={disabled}
                  expenseCategories={expenseCategories}
                  materials={materials}
                />
              </AdminDrawer>
            ) : null}
            <AdminDrawer title="New material" triggerClassName="admin-action ghost" triggerLabel="New material">
              <MaterialManagementForm action={createRawMaterialAction} disabled={disabled} />
            </AdminDrawer>
          </div>
        </div>

        <div className="stack-list">
          {materials.map((material) => (
            <div className="stack-row" key={material.id}>
              <strong>
                {material.name}
                {material.kind === "PACKAGING" ? " · packaging" : ""}
              </strong>
              <span>
                {formatQuantity(material.stockOnHand)} {material.unit} on hand ·{" "}
                {formatMoney(material.costPerUnit)} / {material.unit}
                {material.supplier ? ` · ${material.supplier}` : ""}
                {material.stockOnHand < 0 ? " · recount needed" : ""}
              </span>
              <div className="stack-row-actions">
                <strong>{formatMoney(Math.round(material.costPerUnit * Math.max(0, material.stockOnHand)))}</strong>
                <AdminDrawer
                  title={`Buy ${material.name}`}
                  triggerClassName="admin-action ghost small"
                  triggerLabel="Buy"
                >
                  <MaterialPurchaseForm
                    action={createMaterialPurchaseAction}
                    defaultMaterialId={material.id}
                    disabled={disabled}
                    expenseCategories={expenseCategories}
                    materials={materials}
                  />
                </AdminDrawer>
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
            <p className="admin-help">No materials yet — add one to start building recipes.</p>
          ) : null}
        </div>
      </section>

      <details className="admin-panel admin-collapsible">
        <summary className="panel-header">
          <h2>Purchase history</h2>
          <span>{purchases.length} recorded</span>
        </summary>
        <div className="stack-list">
          {purchases.map((purchase) => {
            const material = materialsById.get(purchase.materialId);
            return (
              <div className="stack-row" key={purchase.id}>
                <strong>{material?.name ?? "Removed material"}</strong>
                <span>
                  {formatDateLabel(purchase.date)} · {formatQuantity(purchase.quantity)}{" "}
                  {material?.unit ?? "units"} · unit cost became {formatMoney(purchase.unitCostAfter)}
                  {purchase.supplier ? ` · ${purchase.supplier}` : ""}
                  {purchase.expenseId ? " · logged as an expense" : ""}
                </span>
                <div className="stack-row-actions">
                  <strong>{formatMoney(purchase.totalCost)}</strong>
                </div>
              </div>
            );
          })}
          {purchases.length === 0 ? <p className="admin-help">No purchases recorded yet.</p> : null}
        </div>
      </details>
    </>
  );

  const recipesTab = (
    <>
      <div className="admin-alert" role="status">
        A recipe is what one finished unit uses. Set it once and the product&apos;s cost is worked out
        automatically — and stays right whenever a material&apos;s price changes.
      </div>

      {materials.length === 0 ? (
        <p className="admin-help">Add materials first — there is nothing to build a recipe from yet.</p>
      ) : (
        recipeTargets.map((target) => (
          <details className="admin-panel admin-collapsible" key={target.variantId}>
            <summary className="panel-header">
              <h2>{target.label}</h2>
              <span>
                {target.recipe.length > 0
                  ? `${formatMoney(target.cost)} to make · ${target.recipe.length} material${target.recipe.length === 1 ? "" : "s"}`
                  : "No recipe yet"}
              </span>
            </summary>
            <div className="admin-panel-section">
              <RecipeEditor
                action={updateRecipeAction}
                disabled={disabled}
                materials={recipeMaterials}
                target={{
                  productId: target.productId,
                  variantId: target.variantId,
                  label: target.label,
                  price: target.price,
                  quantities: Object.fromEntries(
                    target.recipe.map((item) => [item.materialId, item.quantityPerUnit])
                  )
                }}
              />
            </div>
          </details>
        ))
      )}
    </>
  );

  const productionTab = (
    <>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Record production</h2>
          <span>{producible.length} product{producible.length === 1 ? "" : "s"} ready to make</span>
        </div>
        <div className="admin-panel-section">
          <ProductionRunForm action={recordProductionRunAction} disabled={disabled} variants={producible} />
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-header">
          <h2>Production history</h2>
          <span>{runs.length} batch{runs.length === 1 ? "" : "es"}</span>
        </div>
        <div className="stack-list">
          {runs.map((run) => (
            <div className="stack-row" key={run.id}>
              <strong>
                {run.quantityProduced} × {run.productTitle} — {run.variantTitle}
              </strong>
              <span>
                {formatDateLabel(run.createdAt)} · {formatMoney(run.unitCost)} per unit
                {run.shortfallMaterialNames.length > 0
                  ? ` · went short on ${run.shortfallMaterialNames.join(", ")}`
                  : ""}
                {run.note ? ` · ${run.note}` : ""}
              </span>
              <div className="stack-row-actions">
                <strong>{formatMoney(run.totalCost)}</strong>
              </div>
            </div>
          ))}
          {runs.length === 0 ? (
            <p className="admin-help">Nothing produced yet. Record a batch above and finished stock updates itself.</p>
          ) : null}
        </div>
      </section>
    </>
  );

  const tabs: AdminTabSpec[] = [
    { id: "materials", label: "Materials", content: materialsTab },
    { id: "recipes", label: "Recipes", content: recipesTab },
    { id: "production", label: "Production", content: productionTab }
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Production</h1>
          <p className="app-subtitle">
            What she buys, what each product is made of, and what she makes — so the cost of a finished unit is
            worked out rather than guessed.
          </p>
        </div>
      </div>
      {rawCatalogue.sourceMessage ? (
        <div className="admin-alert" role="status">
          {rawCatalogue.sourceMessage}
        </div>
      ) : null}
      <AdminTabs initialTabId={tab} tabs={tabs} />
    </>
  );
}
