import {
  formatAdminMoney,
  formatAdminProductTitle,
  formatAdminVariantLabel,
  getAdminCatalogueData
} from "@/lib/admin/catalogue";
import { ProductManagementForms } from "@/components/admin/product-management-forms";
import { requireAdminPermission } from "@/lib/auth/server";
import {
  createProductWithDefaultVariantAction,
  createVariantAction,
  quickEditCatalogueItemAction,
  updateProductStatusAction
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdminPermission("products.view");
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
        products={catalogue.products.map((product) => ({
          id: product.id,
          title: product.title
        }))}
        source={catalogue.source}
      />
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Quick edit</h2>
          <span>Prices, category, status, and stock</span>
        </div>
        <div className="quick-edit-list">
          {catalogue.rows.map(({ product, variant }) => {
            const selectedCategoryId = product?.categoryIds[0] ?? "";

            return (
              <form action={quickEditCatalogueItemAction} className="quick-edit-row" key={variant.id}>
                <input name="productId" type="hidden" value={product?.id ?? ""} />
                <input name="variantId" type="hidden" value={variant.id} />
                <label className="admin-field">
                  <span>Product</span>
                  <input
                    defaultValue={product?.title ?? "Unknown product"}
                    disabled={!product || catalogue.source !== "live"}
                    name="title"
                    required
                  />
                </label>
                <label className="admin-field">
                  <span>Short copy</span>
                  <input
                    defaultValue={product?.shortCopy ?? ""}
                    disabled={!product || catalogue.source !== "live"}
                    name="shortCopy"
                  />
                </label>
                <label className="admin-field">
                  <span>Category</span>
                  <select
                    defaultValue={selectedCategoryId}
                    disabled={!product || catalogue.source !== "live"}
                    name="categoryId"
                  >
                    <option value="">Uncategorized</option>
                    {catalogue.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  <span>Status</span>
                  <select
                    defaultValue={product?.status ?? "DRAFT"}
                    disabled={!product || catalogue.source !== "live"}
                    name="status"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </label>
                <label className="admin-field">
                  <span>Concerns / needs</span>
                  <select
                    defaultValue={product?.concernIds ?? []}
                    disabled={!product || catalogue.source !== "live"}
                    multiple
                    name="concernIds"
                  >
                    {catalogue.concerns.map((concern) => (
                      <option key={concern.id} value={concern.id}>
                        {concern.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  <span>Product type</span>
                  <select
                    defaultValue={product?.productTypeIds ?? []}
                    disabled={!product || catalogue.source !== "live"}
                    multiple
                    name="productTypeIds"
                  >
                    {catalogue.productTypes.map((productType) => (
                      <option key={productType.id} value={productType.id}>
                        {productType.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  <span>Routine</span>
                  <select
                    defaultValue={product?.routineIds ?? []}
                    disabled={!product || catalogue.source !== "live"}
                    multiple
                    name="routineIds"
                  >
                    {catalogue.routines.map((routine) => (
                      <option key={routine.id} value={routine.id}>
                        {routine.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  <span>Variant</span>
                  <input
                    defaultValue={variant.title}
                    disabled={!product || catalogue.source !== "live"}
                    name="variantTitle"
                    required
                  />
                </label>
                <label className="admin-field">
                  <span>Price GHS</span>
                  <input
                    defaultValue={(variant.price / 100).toFixed(2)}
                    disabled={!product || catalogue.source !== "live"}
                    inputMode="decimal"
                    min="0"
                    name="price"
                    required
                  />
                </label>
                <label className="admin-field">
                  <span>Low stock</span>
                  <input
                    defaultValue={variant.lowStockThreshold}
                    disabled={!product || catalogue.source !== "live"}
                    inputMode="numeric"
                    min="0"
                    name="lowStockThreshold"
                    required
                  />
                </label>
                <label className="admin-field">
                  <span>Stock +/-</span>
                  <input
                    defaultValue="0"
                    disabled={!product || catalogue.source !== "live"}
                    inputMode="numeric"
                    name="stockDelta"
                  />
                </label>
                <label className="admin-field checkbox">
                  <input
                    defaultChecked={product?.bestSeller ?? false}
                    disabled={!product || catalogue.source !== "live"}
                    name="bestSeller"
                    type="checkbox"
                  />
                  <span>Best seller</span>
                </label>
                <button
                  className="admin-action"
                  disabled={!product || catalogue.source !== "live"}
                  type="submit"
                >
                  Save
                </button>
              </form>
            );
          })}
        </div>
      </section>
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
