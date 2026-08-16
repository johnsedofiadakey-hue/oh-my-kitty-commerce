import {
  adminData,
  formatMoney,
  getProductTitle,
  getProductVariantRows,
  getVariantLabel
} from "@/lib/admin/sample-admin-data";

export default function AdminProductsPage() {
  const rows = getProductVariantRows();

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Products</h1>
          <p className="app-subtitle">Catalogue, variants, prices, media, and publishing state.</p>
        </div>
        <button className="admin-action" type="button">
          New product
        </button>
      </div>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Catalogue</h2>
          <span>{adminData.products.length} products</span>
        </div>
        <div className="admin-table">
          <div className="admin-table-row header">
            <span>Product</span>
            <span>Variant</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Status</span>
          </div>
          {rows.map(({ product, variant, lowStock }) => (
            <div className="admin-table-row" key={variant.id}>
              <strong>{getProductTitle(product)}</strong>
              <span>{getVariantLabel(variant)}</span>
              <span>{formatMoney(variant.price)}</span>
              <span className={lowStock ? "status danger" : "status"}>{variant.stockAvailable}</span>
              <span>{product?.status ?? "Unknown"}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="admin-grid two">
        <div className="admin-panel">
          <div className="panel-header">
            <h2>Collections</h2>
            <span>{adminData.collections.length} active groups</span>
          </div>
          <div className="stack-list">
            {adminData.collections.map((collection) => (
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
            <span>{adminData.categories.length} categories</span>
          </div>
          <div className="stack-list">
            {adminData.categories.map((category) => (
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
