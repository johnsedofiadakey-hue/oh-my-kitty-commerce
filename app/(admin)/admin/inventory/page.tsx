import {
  formatDate,
  getAdminOperationsData,
  getProductTitle,
  getVariantLabel
} from "@/lib/admin/operations-data";
import { requireAdminPermission } from "@/lib/auth/server";
import { adjustInventoryAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  await requireAdminPermission("inventory.view");
  const data = await getAdminOperationsData();
  const rows = data.inventoryRows;
  const disabled = data.source !== "live";

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Inventory</h1>
          <p className="app-subtitle">Ledgered stock movements across online, POS, and admin activity.</p>
        </div>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Stock by variant</h2>
          <span>{rows.length} variants &middot; ledgered adjustment</span>
        </div>
        <div className="quick-edit-list">
          {rows.map(({ product, variant, lowStock }) => (
            <form action={adjustInventoryAction} className="quick-edit-row" key={variant.id}>
              <input name="productId" type="hidden" value={variant.productId} />
              <input name="variantId" type="hidden" value={variant.id} />
              <label className="admin-field">
                <span>Variant</span>
                <input disabled value={`${getProductTitle(product)} / ${getVariantLabel(variant)}`} />
              </label>
              <label className="admin-field">
                <span>Available</span>
                <input disabled value={variant.stockAvailable} />
              </label>
              <label className="admin-field">
                <span>Alert</span>
                <input disabled value={lowStock ? "Low" : "Healthy"} />
              </label>
              <label className="admin-field">
                <span>Type</span>
                <select defaultValue="MANUAL_ADJUSTMENT" disabled={disabled} name="type">
                  <option value="STOCK_RECEIVED">Stock received</option>
                  <option value="MANUAL_ADJUSTMENT">Manual adjustment</option>
                  <option value="DAMAGE">Damage</option>
                  <option value="LOSS">Loss</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Quantity delta</span>
                <input
                  disabled={disabled}
                  name="quantityDelta"
                  placeholder="e.g. 10 or -2"
                  required
                  type="number"
                />
              </label>
              <label className="admin-field">
                <span>Reason</span>
                <input disabled={disabled} minLength={3} name="reason" placeholder="Restock delivery" required />
              </label>
              <button className="admin-action" disabled={disabled} type="submit">
                Adjust
              </button>
            </form>
          ))}
          {rows.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
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
