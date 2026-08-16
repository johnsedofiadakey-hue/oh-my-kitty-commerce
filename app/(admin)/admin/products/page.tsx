import {
  formatAdminMoney,
  formatAdminProductTitle,
  formatAdminVariantLabel,
  getAdminCatalogueData
} from "@/lib/admin/catalogue";
import { ProductManagementForms } from "@/components/admin/product-management-forms";
import {
  createProductWithDefaultVariantAction,
  updateProductStatusAction,
  createVariantAction
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const catalogue = await getAdminCatalogueData();

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Products</h1>
          <p className="app-subtitle">Catalogue, variants, prices, media, and publishing state.</p>
        </div>
      </div>
      {catalogue.sourceMessage ? (
        <div className="admin-alert" role="status">
          {catalogue.sourceMessage}
        </div>
      ) : null}
      <ProductManagementForms
        createProductAction={createProductWithDefaultVariantAction}
        createVariantAction={createVariantAction}
        products={catalogue.products}
        source={catalogue.source}
      />
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Catalogue</h2>
          <span>{catalogue.products.length} products</span>
        </div>
        <div className="admin-table">
          <div className="admin-table-row header">
            <span>Product</span>
            <span>Variant</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Status</span>
          </div>
          {catalogue.rows.map(({ product, variant, lowStock }) => (
            <div className="admin-table-row" key={variant.id}>
              <strong>{formatAdminProductTitle(product)}</strong>
              <span>{formatAdminVariantLabel(variant)}</span>
              <span>{formatAdminMoney(variant.price)}</span>
              <span className={lowStock ? "status danger" : "status"}>{variant.stockAvailable}</span>
              {product ? (
                <form action={updateProductStatusAction} className="inline-status-form">
                  <input name="productId" type="hidden" value={product.id} />
                  <select
                    aria-label={`Status for ${product.title}`}
                    defaultValue={product.status}
                    disabled={catalogue.source !== "live"}
                    name="status"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                  <button disabled={catalogue.source !== "live"} type="submit">
                    Save
                  </button>
                </form>
              ) : (
                <span>Unknown</span>
              )}
            </div>
          ))}
        </div>
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
