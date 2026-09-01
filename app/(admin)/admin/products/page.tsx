import { getAdminCatalogueData } from "@/lib/admin/catalogue";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { CreateProductForm, CreateVariantForm } from "@/components/admin/product-management-forms";
import { ProductsCatalogueTable } from "@/components/admin/products-catalogue-table";
import { requireAdminPermission } from "@/lib/auth/server";
import {
  attachProductImageAction,
  createProductWithDefaultVariantAction,
  createVariantAction,
  deleteProductAction,
  deleteProductsAction,
  quickEditCatalogueItemAction
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdminPermission("products.view");
  const rawCatalogue = await getAdminCatalogueData();
  const disabled = rawCatalogue.source !== "live";
  // Firestore's Timestamp is a class instance, not a plain object — React
  // Server Components can't serialize it across the boundary into a Client
  // Component (the catalogue table below needs to be one, for the bulk-select
  // state). A JSON round-trip strips it down to plain data; nothing that
  // renders here reads createdAt/updatedAt as a real Date.
  const catalogue: typeof rawCatalogue = JSON.parse(JSON.stringify(rawCatalogue));

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Products</h1>
          <p className="app-subtitle">Catalogue, variants, prices, media, and publishing state.</p>
        </div>
        <div className="page-heading-actions">
          <AdminDrawer title="Add variant" triggerClassName="admin-action ghost" triggerLabel="Add variant">
            <CreateVariantForm
              action={createVariantAction}
              disabled={disabled}
              products={catalogue.products.map((product) => ({ id: product.id, title: product.title }))}
            />
          </AdminDrawer>
          <AdminDrawer title="New product" triggerLabel="New product">
            <CreateProductForm
              action={createProductWithDefaultVariantAction}
              attachProductImageAction={attachProductImageAction}
              disabled={disabled}
            />
          </AdminDrawer>
        </div>
      </div>
      {catalogue.sourceMessage ? (
        <div className="admin-alert" role="status">
          {catalogue.sourceMessage}
        </div>
      ) : null}
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Catalogue</h2>
          <span>{catalogue.rows.length} variants</span>
        </div>
        <ProductsCatalogueTable
          attachProductImageAction={attachProductImageAction}
          catalogue={catalogue}
          deleteProductAction={deleteProductAction}
          deleteProductsAction={deleteProductsAction}
          disabled={disabled}
          quickEditCatalogueItemAction={quickEditCatalogueItemAction}
        />
      </section>
      <section className="admin-grid two">
        <div className="admin-panel">
          <div className="panel-header">
            <h2>Collections</h2>
            <span>{catalogue.collections.length} active groups</span>
          </div>
          <div className="stack-list">
            {catalogue.collections.map((collection) => (
              <div className="stack-row" key={collection.id}>
                <strong>{collection.title}</strong>
                <span>{collection.productIds.length} products</span>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-panel">
          <div className="panel-header">
            <h2>Categories</h2>
            <span>{catalogue.categories.length} categories</span>
          </div>
          <div className="stack-list">
            {catalogue.categories.map((category) => (
              <div className="stack-row" key={category.id}>
                <strong>{category.title}</strong>
                <span>{category.active ? "Active" : "Inactive"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
