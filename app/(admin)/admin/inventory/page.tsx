import {
  formatDate,
  getAdminOperationsData,
  getProductTitle,
  getVariantLabel,
  toSortableMillis
} from "@/lib/admin/operations-data";
import { requireAdminPermission } from "@/lib/auth/server";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import type { AdminInventoryRow } from "@/lib/admin/operations-data";
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
          <p className="app-subtitle">Stock on hand for every product. Tap one to restock or adjust it.</p>
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
          <span>{rows.length} variants</span>
        </div>
        <div className="order-list">
          {rows.map((row) => (
            <InventoryRow disabled={disabled} key={row.variant.id} row={row} />
          ))}
          {rows.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
        </div>
      </section>
    </>
  );
}

function InventoryRow({ row, disabled }: { row: AdminInventoryRow; disabled: boolean }) {
  const { product, variant, lowStock } = row;

  return (
    <AdminDrawer
      title={`${getProductTitle(product)} — ${getVariantLabel(variant)}`}
      trigger={
        <div className="inventory-row">
          <div className="inventory-row-main">
            <strong>{getProductTitle(product)}</strong>
            <span>{getVariantLabel(variant)}</span>
          </div>
          <span className="order-status-pill">SKU {variant.sku}</span>
          <span className={lowStock ? "order-status-pill urgent" : "order-status-pill good"}>
            {lowStock ? "Low stock" : "Healthy"}
          </span>
          <strong className="inventory-row-stock">{variant.stockAvailable} in stock</strong>
        </div>
      }
    >
      <InventoryDetail disabled={disabled} row={row} />
    </AdminDrawer>
  );
}

function InventoryDetail({ row, disabled }: { row: AdminInventoryRow; disabled: boolean }) {
  const { variant, movements } = row;
  const recentMovements = [...movements]
    .sort((a, b) => toSortableMillis(b.createdAt) - toSortableMillis(a.createdAt))
    .slice(0, 8);

  return (
    <div className="order-detail">
      <section className="order-detail-section">
        <div className="order-detail-meta">
          <span>SKU {variant.sku}</span>
          <span>{variant.stockAvailable} currently in stock</span>
        </div>
      </section>

      <section className="order-detail-section">
        <h3>Adjust stock</h3>
        <form action={adjustInventoryAction} className="admin-form">
          <input name="productId" type="hidden" value={variant.productId} />
          <input name="variantId" type="hidden" value={variant.id} />
          <fieldset disabled={disabled}>
            <label className="admin-field">
              <span>What happened</span>
              <select defaultValue="MANUAL_ADJUSTMENT" name="type">
                <option value="STOCK_RECEIVED">Stock received (restock)</option>
                <option value="MANUAL_ADJUSTMENT">Manual adjustment</option>
                <option value="DAMAGE">Damaged</option>
                <option value="LOSS">Lost</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Quantity change</span>
              <input name="quantityDelta" placeholder="e.g. 10 to add, -2 to remove" required type="number" />
            </label>
            <label className="admin-field">
              <span>Reason</span>
              <input minLength={3} name="reason" placeholder="Restock delivery" required />
            </label>
            <button className="admin-action" type="submit">
              Save adjustment
            </button>
          </fieldset>
        </form>
      </section>

      <section className="order-detail-section">
        <h3>Recent history</h3>
        <div className="stack-list">
          {recentMovements.map((movement) => (
            <div className="stack-row" key={movement.id}>
              <strong>{movement.type.replaceAll("_", " ")}</strong>
              <span>
                {movement.quantityDelta > 0 ? "+" : ""}
                {movement.quantityDelta} &middot; stock after {movement.stockAfter} &middot;{" "}
                {formatDate(movement.createdAt)}
              </span>
            </div>
          ))}
          {recentMovements.length === 0 ? <p className="admin-help">No movements recorded yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
