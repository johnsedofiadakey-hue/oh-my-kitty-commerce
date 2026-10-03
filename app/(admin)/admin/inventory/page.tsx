import {
  formatDate,
  getAdminOperationsData,
  getProductTitle,
  getVariantLabel,
  toSortableMillis
} from "@/lib/admin/operations-data";
import { requireAdminPermission } from "@/lib/auth/server";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { PendingSubmitButton } from "@/components/admin/pending-submit-button";
import { RequestIdField } from "@/components/admin/request-id-field";
import type { AdminInventoryRow } from "@/lib/admin/operations-data";
import type { Product, ProductVariant } from "@/lib/commerce/types";
import { adjustInventoryAction } from "./actions";

export const dynamic = "force-dynamic";

type VariantLookupEntry = { variant: ProductVariant; product: Product | null };

export default async function AdminInventoryPage() {
  await requireAdminPermission("inventory.view");
  const data = await getAdminOperationsData();
  const disabled = data.source !== "live";

  // The shared movement list behind the admin pages is capped at the newest
  // 500 across *all* products, so older products would show a short or empty
  // history. This page reads each product's own history instead.
  const context = data.source === "live" ? getCommerceServerContext() : null;
  const rows = context
    ? await Promise.all(
        data.inventoryRows.map(async (row) => ({
          ...row,
          movements: await context.repo.listInventoryMovements(row.variant.id).catch(() => row.movements)
        }))
      )
    : data.inventoryRows;

  const productsById = new Map(data.products.map((product) => [product.id, product]));
  const variantLookup = new Map<string, VariantLookupEntry>(
    data.variants.map((variant) => [
      variant.id,
      { variant, product: productsById.get(variant.productId) ?? null }
    ])
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Inventory</h1>
          <p className="app-subtitle">
            Stock on hand for every product. A set made from other products has no stock of its own — it shows how
            many can be sold right now based on its components.
          </p>
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
            <InventoryRow disabled={disabled} key={row.variant.id} row={row} variantLookup={variantLookup} />
          ))}
          {rows.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
        </div>
      </section>
    </>
  );
}

function InventoryRow({
  row,
  disabled,
  variantLookup
}: {
  row: AdminInventoryRow;
  disabled: boolean;
  variantLookup: Map<string, VariantLookupEntry>;
}) {
  const { product, variant, isSet, availableStock, lowStock } = row;
  const negative = !isSet && variant.trackInventory && variant.stockAvailable < 0;
  const notForSale = product !== null && product.status !== "ACTIVE";

  return (
    <AdminDrawer
      title={`${getProductTitle(product)} — ${getVariantLabel(variant)}`}
      trigger={
        <div className="inventory-row">
          <div className="inventory-row-main">
            <strong>{getProductTitle(product)}</strong>
            <span>
              {getVariantLabel(variant)}
              {isSet ? " · Set" : ""}
              {notForSale ? ` · ${product.status.toLowerCase()}` : ""}
            </span>
          </div>
          <span className="order-status-pill inventory-row-sku" title={variant.sku}>
            SKU {variant.sku}
          </span>
          <span className={lowStock ? "order-status-pill urgent" : "order-status-pill good"}>
            {negative ? "Negative stock" : lowStock ? "Low stock" : "Healthy"}
          </span>
          <strong className="inventory-row-stock">{availableStock} in stock</strong>
        </div>
      }
    >
      <InventoryDetail disabled={disabled} row={row} variantLookup={variantLookup} />
    </AdminDrawer>
  );
}

function InventoryDetail({
  row,
  disabled,
  variantLookup
}: {
  row: AdminInventoryRow;
  disabled: boolean;
  variantLookup: Map<string, VariantLookupEntry>;
}) {
  const { variant, isSet, availableStock, movements } = row;
  const recentMovements = [...movements]
    .sort((a, b) => toSortableMillis(b.createdAt) - toSortableMillis(a.createdAt))
    .slice(0, 8);

  const components = (variant.bundleComponents ?? [])
    .map((item) => ({ item, entry: variantLookup.get(item.variantId) }))
    .filter((row): row is { item: { variantId: string; quantity: number }; entry: VariantLookupEntry } =>
      Boolean(row.entry)
    );

  const usedIn = [...variantLookup.values()].filter(({ variant: candidate }) =>
    candidate.bundleComponents?.some((item) => item.variantId === variant.id)
  );

  return (
    <div className="order-detail">
      <section className="order-detail-section">
        <div className="order-detail-meta">
          <span>SKU {variant.sku}</span>
          <span>{availableStock} currently in stock</span>
        </div>
      </section>

      {components.length > 0 ? (
        <section className="order-detail-section">
          <h3>Made from</h3>
          <div className="stack-list">
            {components.map(({ item, entry }) => (
              <div className="stack-row" key={item.variantId}>
                <strong>{getProductTitle(entry.product)}</strong>
                <span>
                  {item.quantity} per set &middot; {entry.variant.stockAvailable} in stock
                </span>
              </div>
            ))}
          </div>
          <p className="admin-help">
            This set has no stock of its own — selling one draws straight from the components above, and{" "}
            {availableStock} is how many full sets they can currently cover.
          </p>
        </section>
      ) : null}

      {usedIn.length > 0 ? (
        <section className="order-detail-section">
          <h3>Used in</h3>
          <div className="stack-list">
            {usedIn.map(({ variant: setVariant, product: setProduct }) => {
              const quantity = setVariant.bundleComponents?.find((item) => item.variantId === variant.id)?.quantity;
              return (
                <div className="stack-row" key={setVariant.id}>
                  <strong>{getProductTitle(setProduct)}</strong>
                  <span>{quantity} per set</span>
                </div>
              );
            })}
          </div>
          <p className="admin-help">Selling any of these draws from this item&apos;s stock too.</p>
        </section>
      ) : null}

      {isSet ? (
        <section className="order-detail-section">
          <h3>Adjust stock</h3>
          <p className="admin-help">
            Sets aren&apos;t adjusted directly — restock or correct the components listed above instead.
          </p>
        </section>
      ) : (
        <section className="order-detail-section">
          <h3>Adjust stock</h3>
          <form action={adjustInventoryAction} className="admin-form">
            <input name="productId" type="hidden" value={variant.productId} />
            <input name="variantId" type="hidden" value={variant.id} />
            <RequestIdField />
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
              <PendingSubmitButton>Save adjustment</PendingSubmitButton>
            </fieldset>
          </form>
        </section>
      )}

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
