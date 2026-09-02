"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { MediaUploader } from "@/components/admin/media-uploader";
import {
  initialAdminActionState,
  type AdminActionState,
  type AdminFormAction
} from "@/lib/admin/product-form";
import type { getAdminCatalogueData } from "@/lib/admin/catalogue";

type CatalogueData = Awaited<ReturnType<typeof getAdminCatalogueData>>;
type CatalogueRow = CatalogueData["rows"][number];

type ProductsCatalogueTableProps = {
  catalogue: CatalogueData;
  disabled: boolean;
  attachProductImageAction: (input: {
    productId: string;
    variantId: string;
    storagePath: string;
    url: string;
    alt: string;
  }) => Promise<AdminActionState>;
  deleteProductAction: (productId: string) => Promise<AdminActionState>;
  deleteProductsAction: (productIds: string[]) => Promise<AdminActionState>;
  quickEditCatalogueItemAction: AdminFormAction;
};

export function ProductsCatalogueTable({
  catalogue,
  disabled,
  attachProductImageAction,
  deleteProductAction,
  deleteProductsAction,
  quickEditCatalogueItemAction
}: ProductsCatalogueTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [typedConfirm, setTypedConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const uniqueProductIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of catalogue.rows) {
      if (row.product) {
        ids.add(row.product.id);
      }
    }
    return Array.from(ids);
  }, [catalogue.rows]);

  const titleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of catalogue.rows) {
      if (row.product) {
        map.set(row.product.id, row.product.title);
      }
    }
    return map;
  }, [catalogue.rows]);

  const allSelected = uniqueProductIds.length > 0 && uniqueProductIds.every((id) => selected.has(id));

  function toggleOne(productId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(uniqueProductIds));
  }

  function openConfirm() {
    setConfirming(true);
    setTypedConfirm("");
    setError("");
  }

  async function handleBulkDelete() {
    setBusy(true);
    setError("");

    const result = await deleteProductsAction(Array.from(selected));
    if (result.status === "success") {
      setSelected(new Set());
      setConfirming(false);
      router.refresh();
    } else {
      setError(result.message);
    }
    setBusy(false);
  }

  const selectedTitles = Array.from(selected).map((id) => titleById.get(id) ?? id);

  return (
    <>
      {selected.size > 0 && !confirming ? (
        <div className="admin-bulk-action-bar">
          <span>
            <strong>{selected.size}</strong> product{selected.size === 1 ? "" : "s"} selected
          </span>
          <div className="admin-bulk-action-bar-actions">
            <button
              className="admin-action ghost small"
              onClick={() => setSelected(new Set())}
              type="button"
            >
              Clear
            </button>
            <button className="admin-action danger small" disabled={disabled} onClick={openConfirm} type="button">
              Delete selected
            </button>
          </div>
        </div>
      ) : null}

      {confirming ? (
        <div className="admin-bulk-confirm">
          <p>
            This permanently deletes <strong>{selected.size}</strong> product
            {selected.size === 1 ? "" : "s"} and all their variants. This can&apos;t be undone.
          </p>
          <ul className="admin-bulk-confirm-list">
            {selectedTitles.map((title, index) => (
              <li key={index}>{title}</li>
            ))}
          </ul>
          <p>
            Type <strong>DELETE</strong> to confirm.
          </p>
          <input
            disabled={busy}
            onChange={(event) => setTypedConfirm(event.target.value)}
            placeholder="DELETE"
            value={typedConfirm}
          />
          {error ? <p className="form-error">{error}</p> : null}
          <div className="admin-danger-zone-actions">
            <button
              className="admin-action danger small"
              disabled={typedConfirm.trim() !== "DELETE" || busy}
              onClick={handleBulkDelete}
              type="button"
            >
              {busy ? "Deleting..." : `Confirm delete (${selected.size})`}
            </button>
            <button
              className="admin-action ghost small"
              disabled={busy}
              onClick={() => {
                setConfirming(false);
                setError("");
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="admin-table five with-select">
        <div className="admin-table-row header">
          <span className="admin-table-select-cell">
            <input
              aria-label="Select all products"
              checked={allSelected}
              disabled={disabled}
              onChange={toggleAll}
              type="checkbox"
            />
          </span>
          <span>Product</span>
          <span>Variant</span>
          <span>Price</span>
          <span>Stock</span>
          <span>Status</span>
        </div>
        {catalogue.rows.map((row) => (
          <ProductRow
            attachProductImageAction={attachProductImageAction}
            catalogue={catalogue}
            deleteProductAction={deleteProductAction}
            disabled={disabled}
            key={row.variant.id}
            onToggleSelect={row.product ? () => toggleOne(row.product!.id) : undefined}
            quickEditCatalogueItemAction={quickEditCatalogueItemAction}
            row={row}
            selected={row.product ? selected.has(row.product.id) : false}
          />
        ))}
        {catalogue.rows.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
      </div>
    </>
  );
}

function ProductRow({
  catalogue,
  disabled,
  row,
  selected,
  onToggleSelect,
  attachProductImageAction,
  deleteProductAction,
  quickEditCatalogueItemAction
}: {
  catalogue: CatalogueData;
  disabled: boolean;
  row: CatalogueRow;
  selected: boolean;
  onToggleSelect?: () => void;
  attachProductImageAction: ProductsCatalogueTableProps["attachProductImageAction"];
  deleteProductAction: ProductsCatalogueTableProps["deleteProductAction"];
  quickEditCatalogueItemAction: ProductsCatalogueTableProps["quickEditCatalogueItemAction"];
}) {
  const { product, variant, lowStock } = row;

  return (
    <div className="admin-table-row">
      <span className="admin-table-select-cell">
        <input
          aria-label={product ? `Select ${product.title}` : "Select product"}
          checked={selected}
          disabled={disabled || !onToggleSelect}
          onChange={onToggleSelect}
          type="checkbox"
        />
      </span>
      <strong>{product?.title ?? "Unknown product"}</strong>
      <span>{variant.title}</span>
      <span>GHS {(variant.price / 100).toFixed(2)}</span>
      <span className={lowStock ? "status danger" : "status"}>{variant.stockAvailable}</span>
      <span className="catalogue-status-cell">
        <span className={product?.status === "ACTIVE" ? "status" : "status neutral"}>
          {product?.status ?? "—"}
        </span>
        <ProductEditDrawer
          attachProductImageAction={attachProductImageAction}
          catalogue={catalogue}
          deleteProductAction={deleteProductAction}
          disabled={disabled}
          product={product}
          quickEditCatalogueItemAction={quickEditCatalogueItemAction}
          variant={variant}
        />
      </span>
    </div>
  );
}

function ProductEditDrawer({
  catalogue,
  disabled,
  product,
  variant,
  attachProductImageAction,
  deleteProductAction,
  quickEditCatalogueItemAction
}: {
  catalogue: CatalogueData;
  disabled: boolean;
  product: CatalogueData["products"][number] | null;
  variant: CatalogueRow["variant"];
  attachProductImageAction: ProductsCatalogueTableProps["attachProductImageAction"];
  deleteProductAction: ProductsCatalogueTableProps["deleteProductAction"];
  quickEditCatalogueItemAction: ProductsCatalogueTableProps["quickEditCatalogueItemAction"];
}) {
  const [state, formAction, pending] = useActionState(quickEditCatalogueItemAction, initialAdminActionState);

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
      <form action={formAction} className="admin-form">
        <input name="productId" type="hidden" value={product.id} />
        <input name="variantId" type="hidden" value={variant.id} />
        <fieldset disabled={disabled || pending}>
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
            <label className="admin-field">
              <span>
                Cost per unit GHS
                {catalogue.rawMaterials.length > 0 ? " (ignored if you set a recipe below)" : " (for profit reports — leave blank if unknown)"}
              </span>
              <input
                defaultValue={variant.cost ? (variant.cost / 100).toFixed(2) : ""}
                inputMode="decimal"
                min="0"
                name="cost"
                placeholder="e.g. 15.00"
              />
            </label>
          </div>
          {catalogue.rawMaterials.length > 0 ? (
            <div className="admin-field-group">
              <span className="admin-field-group-label">
                Recipe — how much of each material one unit uses. Leave a material at 0 if it&apos;s not
                used. Cost per unit is calculated from these automatically.
              </span>
              {catalogue.rawMaterials.map((material) => {
                const existing = variant.recipe?.find((item) => item.materialId === material.id);
                return (
                  <label className="admin-field recipe-field" key={material.id}>
                    <span>
                      {material.name} <small>({material.unit})</small>
                    </span>
                    <input
                      defaultValue={existing?.quantityPerUnit ?? ""}
                      inputMode="decimal"
                      min="0"
                      name={`recipeQuantity.${material.id}`}
                      placeholder="0"
                      step="any"
                    />
                  </label>
                );
              })}
            </div>
          ) : null}
          {catalogue.variants.length > 1 ? (
            <div className="admin-field-group">
              <span className="admin-field-group-label">
                Bundle contents — if this variant is a set assembled from other products, list how many of
                each go into one set. Leave everything blank if this isn&apos;t a set.
              </span>
              {catalogue.variants
                .filter((other) => other.id !== variant.id)
                .map((other) => {
                  const otherProductTitle =
                    catalogue.products.find((p) => p.id === other.productId)?.title ?? "Unknown product";
                  const existing = variant.bundleComponents?.find((item) => item.variantId === other.id);
                  return (
                    <label className="admin-field recipe-field" key={other.id}>
                      <span>
                        {otherProductTitle} <small>({other.title})</small>
                      </span>
                      <input
                        defaultValue={existing?.quantity ?? ""}
                        inputMode="numeric"
                        min="0"
                        name={`bundleQuantity.${other.id}`}
                        placeholder="0"
                      />
                    </label>
                  );
                })}
            </div>
          ) : null}
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
          {state.message ? (
            <p className={`admin-form-status ${state.status}`}>{state.message}</p>
          ) : null}
          <button className="admin-action" type="submit">
            {pending ? "Saving..." : "Save changes"}
          </button>
        </fieldset>
      </form>
      <DeleteProductButton
        action={deleteProductAction}
        disabled={disabled}
        productId={product.id}
        productTitle={product.title}
      />
    </AdminDrawer>
  );
}
