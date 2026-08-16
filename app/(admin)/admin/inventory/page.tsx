import {
  formatDate,
  getInventoryRows,
  getProductTitle,
  getVariantLabel
} from "@/lib/admin/sample-admin-data";

export default function AdminInventoryPage() {
  const rows = getInventoryRows();

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Inventory</h1>
          <p className="app-subtitle">Ledgered stock movements across online, POS, and admin activity.</p>
        </div>
        <button className="admin-action" type="button">
          Adjust stock
        </button>
      </div>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Stock by variant</h2>
          <span>{rows.length} variants</span>
        </div>
        <div className="admin-table">
          <div className="admin-table-row header">
            <span>Product</span>
            <span>Variant</span>
            <span>Available</span>
            <span>On hand</span>
            <span>Alert</span>
          </div>
          {rows.map(({ product, variant, lowStock }) => (
            <div className="admin-table-row" key={variant.id}>
              <strong>{getProductTitle(product)}</strong>
              <span>{getVariantLabel(variant)}</span>
              <span>{variant.stockAvailable}</span>
              <span>{variant.stockOnHand}</span>
              <span className={lowStock ? "status danger" : "status"}>
                {lowStock ? "Low" : "Healthy"}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Movement ledger</h2>
          <span>Recent movements</span>
        </div>
        <div className="stack-list">
          {rows.flatMap((row) =>
            row.movements.map((movement) => (
              <div className="stack-row" key={movement.id}>
                <strong>{movement.type.replaceAll("_", " ")}</strong>
                <span>
                  {getProductTitle(row.product)} / {movement.quantityDelta} / stock after{" "}
                  {movement.stockAfter} / {formatDate(movement.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
