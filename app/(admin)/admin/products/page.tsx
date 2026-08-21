import { getAdminCatalogueData } from "@/lib/admin/catalogue";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { MediaUploader } from "@/components/admin/media-uploader";
import { CreateProductForm, CreateVariantForm } from "@/components/admin/product-management-forms";
import { requireAdminPermission } from "@/lib/auth/server";
import {
  attachProductImageAction,
  createProductWithDefaultVariantAction,
  createVariantAction,
  quickEditCatalogueItemAction
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdminPermission("products.view");
  const catalogue = await getAdminCatalogueData();
  const disabled = catalogue.source !== "live";

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
            <CreateProductForm action={createProductWithDefaultVariantAction} disabled={disabled} />
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
        <div className="admin-table five">
          <div className="admin-table-row header">
            <span>Product</span>
            <span>Variant</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Status</span>
          </div>
          {catalogue.rows.map(({ product, variant, lowStock }) => (
            <div className="admin-table-row" key={variant.id}>
              <strong>{product?.title ?? "Unknown product"}</strong>
              <span>{variant.title}</span>
              <span>GHS {(variant.price / 100).toFixed(2)}</span>
              <span className={lowStock ? "status danger" : "status"}>{variant.stockAvailable}</span>
              <span className="catalogue-status-cell">
                <span className={product?.status === "ACTIVE" ? "status" : "status neutral"}>
                  {product?.status ?? "—"}
                </span>
                <ProductEditDrawer catalogue={catalogue} disabled={disabled} product={product} variant={variant} />
              </span>
            </div>
          ))}
          {catalogue.rows.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
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

type CatalogueData = Awaited<ReturnType<typeof getAdminCatalogueData>>;

function ProductEditDrawer({
  catalogue,
  disabled,
  product,
  variant
}: {
  catalogue: CatalogueData;
  disabled: boolean;
  product: CatalogueData["products"][number] | null;
  variant: CatalogueData["rows"][number]["variant"];
}) {
  if (!product) {
    return null;
  }

  const selectedCategoryId = product.categoryIds[0] ?? "";
  const mediaId = (variant.mediaIds ?? [])[0] ?? (product.mediaIds ?? [])[0];
  const currentImageUrl = mediaId ? catalogue.media.find((asset) => asset.id === mediaId)?.url : undefined;

  return (
    <AdminDrawer title={`Edit ${product.title}`} triggerClassName="admin-action ghost small" triggerLabel="Edit">
      <div className="admin-panel-section">
        <span className="admin-field-group-label">Product photo</span>
        <MediaUploader
          alt={product.title}
          currentImageUrl={currentImageUrl}
          disabled={disabled}
          onAttach={attachProductImageAction}
          productId={product.id}
          variantId={variant.id}
        />
      </div>
      <form action={quickEditCatalogueItemAction} className="admin-form">
        <input name="productId" type="hidden" value={product.id} />
        <input name="variantId" type="hidden" value={variant.id} />
        <fieldset disabled={disabled}>
          <label className="admin-field">
            <span>Product name</span>
            <input defaultValue={product.title} name="title" required />
          </label>
          <label className="admin-field">
            <span>Short copy</span>
            <input defaultValue={product.shortCopy ?? ""} name="shortCopy" />
          </label>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Category</span>
              <select defaultValue={selectedCategoryId} name="categoryId">
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
              <select defaultValue={product.status} name="status">
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
          </div>

          <span className="admin-field-group-label">Concerns / needs</span>
          <div className="admin-chip-group">
            {catalogue.concerns.map((concern) => (
              <label className="admin-chip" key={concern.id}>
                <input
                  defaultChecked={product.concernIds.includes(concern.id)}
                  name="concernIds"
                  type="checkbox"
                  value={concern.id}
                />
                <span>{concern.title}</span>
              </label>
            ))}
            {catalogue.concerns.length === 0 ? (
              <p className="admin-help">None set up yet — add these in Taxonomy.</p>
            ) : null}
          </div>

          <span className="admin-field-group-label">Product type</span>
          <div className="admin-chip-group">
            {catalogue.productTypes.map((productType) => (
              <label className="admin-chip" key={productType.id}>
                <input
                  defaultChecked={product.productTypeIds.includes(productType.id)}
                  name="productTypeIds"
                  type="checkbox"
                  value={productType.id}
                />
                <span>{productType.title}</span>
              </label>
            ))}
            {catalogue.productTypes.length === 0 ? (
              <p className="admin-help">None set up yet — add these in Taxonomy.</p>
            ) : null}
          </div>

          <span className="admin-field-group-label">Routine</span>
          <div className="admin-chip-group">
            {catalogue.routines.map((routine) => (
              <label className="admin-chip" key={routine.id}>
                <input
                  defaultChecked={product.routineIds.includes(routine.id)}
                  name="routineIds"
                  type="checkbox"
                  value={routine.id}
                />
                <span>{routine.title}</span>
              </label>
            ))}
            {catalogue.routines.length === 0 ? (
              <p className="admin-help">None set up yet — add these in Taxonomy.</p>
            ) : null}
          </div>

          <label className="admin-field">
            <span>Variant name</span>
            <input defaultValue={variant.title} name="variantTitle" required />
          </label>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Price GHS</span>
              <input
                defaultValue={(variant.price / 100).toFixed(2)}
                inputMode="decimal"
                min="0"
                name="price"
                required
              />
            </label>
            <label className="admin-field">
              <span>Was price GHS (sale — leave blank for no sale)</span>
              <input
                defaultValue={variant.compareAtPrice ? (variant.compareAtPrice / 100).toFixed(2) : ""}
                inputMode="decimal"
                min="0"
                name="compareAtPrice"
                placeholder="e.g. 100.00"
              />
            </label>
          </div>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Low stock alert</span>
              <input defaultValue={variant.lowStockThreshold} inputMode="numeric" min="0" name="lowStockThreshold" required />
            </label>
          </div>
          <label className="admin-field">
            <span>Adjust stock (+/-)</span>
            <input defaultValue="0" inputMode="numeric" name="stockDelta" />
          </label>
          <label className="admin-field">
            <span>Shop position (lower shows first — leave blank for A–Z order)</span>
            <input
              defaultValue={product.homepagePriority ?? ""}
              inputMode="numeric"
              min="0"
              name="homepagePriority"
              placeholder="Auto (A–Z)"
            />
          </label>
          <label className="admin-field checkbox">
            <input defaultChecked={product.bestSeller} name="bestSeller" type="checkbox" />
            <span>Best seller (shows in Live Products on the home page)</span>
          </label>
          <button className="admin-action" type="submit">
            Save changes
          </button>
        </fieldset>
      </form>
    </AdminDrawer>
  );
}
