"use client";

import { useActionState, useState } from "react";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { initialAdminActionState, type AdminActionState } from "@/lib/admin/product-form";
import type { CapitalAssetCategory } from "@/lib/commerce/types";

const CATEGORY_LABELS: Record<CapitalAssetCategory, string> = {
  EQUIPMENT: "Equipment",
  FURNITURE: "Furniture",
  MACHINE: "Machine",
  PROPERTY: "Property",
  OTHER: "Other"
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as CapitalAssetCategory[];

type AssetFormAction = (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;

function AssetFields({
  defaultCategory,
  defaultPurchaseDate,
  defaultPurchaseCost,
  defaultLocation,
  defaultNotes,
  defaultTrackDepreciation,
  defaultUsefulLifeYears
}: {
  defaultCategory?: CapitalAssetCategory;
  defaultPurchaseDate?: string;
  defaultPurchaseCost?: string;
  defaultLocation?: string;
  defaultNotes?: string;
  defaultTrackDepreciation?: boolean;
  defaultUsefulLifeYears?: number | null;
}) {
  const [trackDepreciation, setTrackDepreciation] = useState(defaultTrackDepreciation ?? false);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <label className="admin-field">
        <span>Category</span>
        <select defaultValue={defaultCategory ?? "EQUIPMENT"} name="category" required>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-field">
        <span>Purchase date</span>
        <input defaultValue={defaultPurchaseDate ?? today} name="purchaseDate" required type="date" />
      </label>
      <label className="admin-field">
        <span>Purchase cost GHS</span>
        <input defaultValue={defaultPurchaseCost} inputMode="decimal" name="purchaseCost" placeholder="e.g. 5000.00" required />
      </label>
      <label className="admin-field">
        <span>Location (optional)</span>
        <input defaultValue={defaultLocation} name="location" placeholder="e.g. Shop back room" />
      </label>
      <label className="admin-field">
        <span>Notes (optional)</span>
        <input defaultValue={defaultNotes} name="notes" />
      </label>
      <label className="admin-field checkbox">
        <input
          checked={trackDepreciation}
          name="trackDepreciation"
          onChange={(event) => setTrackDepreciation(event.target.checked)}
          type="checkbox"
        />
        <span>Track depreciation</span>
      </label>
      {trackDepreciation ? (
        <label className="admin-field">
          <span>Useful life (years)</span>
          <input
            defaultValue={defaultUsefulLifeYears ?? ""}
            inputMode="numeric"
            max="50"
            min="1"
            name="usefulLifeYears"
            required
            type="number"
          />
        </label>
      ) : null}
    </>
  );
}

export function CreateAssetForm({ action, disabled }: { action: AssetFormAction; disabled: boolean }) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);

  return (
    <form action={formAction} className="admin-form">
      <fieldset disabled={disabled || pending}>
        <label className="admin-field">
          <span>Name</span>
          <input name="name" placeholder="e.g. Split-unit AC" required />
        </label>
        <AssetFields />
        {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
        <button className="admin-action" type="submit">
          {pending ? "Adding..." : "Add asset"}
        </button>
      </fieldset>
    </form>
  );
}

export function AssetRow({
  assetId,
  name,
  categoryLabel,
  category,
  purchaseDateLabel,
  purchaseDateValue,
  purchaseCostLabel,
  purchaseCostValue,
  bookValueLabel,
  location,
  notes,
  trackDepreciation,
  usefulLifeYears,
  disabled,
  updateAction,
  deleteAction
}: {
  assetId: string;
  name: string;
  categoryLabel: string;
  category: CapitalAssetCategory;
  purchaseDateLabel: string;
  purchaseDateValue: string;
  purchaseCostLabel: string;
  purchaseCostValue: string;
  bookValueLabel: string | null;
  location?: string;
  notes?: string;
  trackDepreciation: boolean;
  usefulLifeYears: number | null;
  disabled: boolean;
  updateAction: AssetFormAction;
  deleteAction: (assetId: string) => Promise<AdminActionState>;
}) {
  const [state, formAction, pending] = useActionState(updateAction, initialAdminActionState);
  const [busy, setBusy] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  async function handleDelete() {
    if (!window.confirm(`Delete the asset "${name}"?`)) {
      return;
    }

    setBusy(true);
    const result = await deleteAction(assetId);
    setDeleteMessage(result.status === "error" ? result.message : "");
    setBusy(false);
  }

  return (
    <AdminDrawer
      title={name}
      trigger={
        <div className="inventory-row">
          <div className="inventory-row-main">
            <strong>{name}</strong>
            <span>
              {categoryLabel} &middot; {purchaseDateLabel} &middot; {location || "No location set"}
            </span>
          </div>
          <span className="order-status-pill neutral">{purchaseCostLabel} cost</span>
          <strong className="inventory-row-stock">{bookValueLabel ?? purchaseCostLabel}</strong>
        </div>
      }
    >
      <div className="order-detail">
        <form action={formAction} className="admin-form">
          <input name="id" type="hidden" value={assetId} />
          <fieldset disabled={disabled || pending}>
            <label className="admin-field">
              <span>Name</span>
              <input defaultValue={name} name="name" required />
            </label>
            <AssetFields
              defaultCategory={category}
              defaultLocation={location}
              defaultNotes={notes}
              defaultPurchaseCost={purchaseCostValue}
              defaultPurchaseDate={purchaseDateValue}
              defaultTrackDepreciation={trackDepreciation}
              defaultUsefulLifeYears={usefulLifeYears}
            />
            {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
            <button className="admin-action" type="submit">
              {pending ? "Saving..." : "Save changes"}
            </button>
          </fieldset>
        </form>
        <section className="order-detail-section">
          <h3>Danger zone</h3>
          <button className="admin-action danger small" disabled={disabled || busy} onClick={() => void handleDelete()} type="button">
            {busy ? "Deleting..." : "Delete asset"}
          </button>
          {deleteMessage ? <p className="form-error">{deleteMessage}</p> : null}
        </section>
      </div>
    </AdminDrawer>
  );
}
