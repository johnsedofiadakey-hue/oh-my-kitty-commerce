"use client";

import { useActionState } from "react";
import { type AdminFormAction, initialAdminActionState } from "@/lib/admin/product-form";
import type { RawMaterialKind } from "@/lib/commerce/types";

/**
 * Deliberately NOT the full RawMaterial: that type carries createdAt /
 * updatedAt, which are Firestore Timestamp class instances at runtime, and
 * passing a class instance from a server component into a client one throws
 * ("Only plain objects... can be passed to Client Components"). Naming only
 * the fields this form actually edits makes the boundary safe by
 * construction rather than by remembering to strip the object first.
 */
export type EditableMaterial = {
  id: string;
  name: string;
  unit: string;
  kind: RawMaterialKind;
  costPerUnit: number;
  stockOnHand: number;
  lowStockThreshold: number;
  supplier?: string;
};

type MaterialManagementFormProps = {
  action: AdminFormAction;
  material?: EditableMaterial;
  disabled: boolean;
};

export function MaterialManagementForm({ action, material, disabled }: MaterialManagementFormProps) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);

  return (
    <form action={formAction} className="admin-form">
      <fieldset disabled={disabled || pending}>
        {material ? <input name="id" type="hidden" value={material.id} /> : null}
        <label className="admin-field">
          <span>Material name</span>
          <input defaultValue={material?.name} name="name" placeholder="Boric acid powder" required />
        </label>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Unit (how it&apos;s measured)</span>
            <input defaultValue={material?.unit} name="unit" placeholder="g, ml, piece" required />
          </label>
          <label className="admin-field">
            <span>Type</span>
            <select defaultValue={material?.kind ?? "INGREDIENT"} name="kind">
              <option value="INGREDIENT">Ingredient — goes into the product</option>
              <option value="PACKAGING">Packaging — bottle, label, box</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
        </div>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>{material ? "Cost per unit GHS" : "Starting cost per unit GHS"}</span>
            <input
              defaultValue={material?.costPerUnit ? (material.costPerUnit / 100).toFixed(2) : ""}
              inputMode="decimal"
              min="0"
              name="costPerUnit"
              placeholder="e.g. 0.50"
              required
            />
          </label>
          <label className="admin-field">
            <span>{material ? "Stock on hand" : "Starting stock"}</span>
            <input
              defaultValue={material?.stockOnHand ?? 0}
              inputMode="decimal"
              name="stockOnHand"
              placeholder="0"
            />
          </label>
        </div>
        <p className="admin-help">
          After this, use <strong>Log purchase</strong> to add stock — it works out the cost per unit from what
          you actually paid, so you never have to calculate it yourself.
        </p>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Warn me below</span>
            <input
              defaultValue={material?.lowStockThreshold ?? 0}
              inputMode="decimal"
              min="0"
              name="lowStockThreshold"
              placeholder="0"
            />
          </label>
          <label className="admin-field">
            <span>Supplier (optional)</span>
            <input defaultValue={material?.supplier ?? ""} name="supplier" placeholder="e.g. Madina Market" />
          </label>
        </div>
        {state.message ? (
          <p className={`admin-form-status ${state.status}`}>{state.message}</p>
        ) : null}
        <button className="admin-action" type="submit">
          {pending ? "Saving..." : material ? "Save material" : "Add material"}
        </button>
      </fieldset>
      {disabled ? <p className="admin-help">Enable Firestore and sign in to manage materials.</p> : null}
    </form>
  );
}
