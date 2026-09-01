"use client";

import { useActionState } from "react";
import { type AdminFormAction, initialAdminActionState } from "@/lib/admin/product-form";
import type { RawMaterial } from "@/lib/commerce/types";

type MaterialManagementFormProps = {
  action: AdminFormAction;
  material?: RawMaterial;
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
            <span>Cost per unit GHS</span>
            <input
              defaultValue={material?.costPerUnit ? (material.costPerUnit / 100).toFixed(2) : ""}
              inputMode="decimal"
              min="0"
              name="costPerUnit"
              placeholder="e.g. 0.50"
              required
            />
          </label>
        </div>
        <label className="admin-field">
          <span>Supplier (optional)</span>
          <input defaultValue={material?.supplier ?? ""} name="supplier" placeholder="e.g. Madina Market" />
        </label>
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
