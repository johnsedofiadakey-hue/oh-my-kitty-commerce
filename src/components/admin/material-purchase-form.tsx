"use client";

import { useActionState, useState } from "react";
import { initialAdminActionState, type AdminFormAction } from "@/lib/admin/product-form";
import { formatMoney } from "@/lib/commerce/format";

type PurchaseMaterial = {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
  stockOnHand: number;
  supplier?: string;
};

type ExpenseCategoryOption = {
  id: string;
  title: string;
};

/**
 * Records a supplier delivery. She enters what she got and what she paid —
 * never a unit cost — and the resulting average is previewed live so there
 * is no surprise after saving.
 */
export function MaterialPurchaseForm({
  action,
  materials,
  expenseCategories,
  defaultMaterialId,
  disabled
}: {
  action: AdminFormAction;
  materials: PurchaseMaterial[];
  expenseCategories: ExpenseCategoryOption[];
  defaultMaterialId?: string;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);
  const [materialId, setMaterialId] = useState(defaultMaterialId ?? materials[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const material = materials.find((entry) => entry.id === materialId);
  const parsedQuantity = Number.parseFloat(quantity);
  const parsedTotal = Number.parseFloat(totalCost);
  // Mirrors blendUnitCost on the server: held stock at its current cost,
  // blended with this delivery at what it actually cost.
  const preview =
    material && Number.isFinite(parsedQuantity) && parsedQuantity > 0 && Number.isFinite(parsedTotal) && parsedTotal > 0
      ? Math.round(
          (Math.max(0, material.stockOnHand) * material.costPerUnit + parsedTotal * 100) /
            (Math.max(0, material.stockOnHand) + parsedQuantity)
        )
      : null;

  const formKey = state.status === "success" ? `saved-${state.message}` : "editing";

  return (
    <form action={formAction} className="admin-form">
      <fieldset disabled={disabled || pending} key={formKey}>
        <label className="admin-field">
          <span>Material</span>
          <select name="materialId" onChange={(event) => setMaterialId(event.target.value)} required value={materialId}>
            {materials.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name} ({entry.unit})
              </option>
            ))}
          </select>
        </label>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Quantity received{material ? ` (${material.unit})` : ""}</span>
            <input
              autoFocus
              inputMode="decimal"
              name="quantity"
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="e.g. 5000"
              required
              value={quantity}
            />
          </label>
          <label className="admin-field">
            <span>Total paid GHS</span>
            <input
              inputMode="decimal"
              name="totalCost"
              onChange={(event) => setTotalCost(event.target.value)}
              placeholder="e.g. 200.00"
              required
              value={totalCost}
            />
          </label>
        </div>

        {preview !== null && material ? (
          <p className="admin-help">
            Cost per {material.unit} becomes <strong>{formatMoney(preview)}</strong>
            {material.stockOnHand > 0 ? ` (blended with the ${material.stockOnHand} ${material.unit} already in stock)` : ""}.
            Every recipe using it re-costs automatically.
          </p>
        ) : null}

        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Date</span>
            <input defaultValue={today} name="date" required type="date" />
          </label>
          <label className="admin-field">
            <span>Supplier (optional)</span>
            <input defaultValue={material?.supplier ?? ""} name="supplier" placeholder="e.g. Madina Market" />
          </label>
        </div>

        {expenseCategories.length > 0 ? (
          <label className="admin-field">
            <span>Also log as an expense</span>
            <select defaultValue="" name="expenseCategoryId">
              <option value="">No — I&apos;ll record the spend separately</option>
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  Yes — under {category.title}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="admin-help">
            Add an expense category under Financial &rarr; Setup to have purchases post to the P&amp;L
            automatically.
          </p>
        )}

        <label className="admin-field">
          <span>Note (optional)</span>
          <input name="note" placeholder="Invoice number, batch, anything worth remembering" />
        </label>

        {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
        <button className="admin-action" type="submit">
          {pending ? "Saving..." : "Record purchase"}
        </button>
      </fieldset>
      {disabled ? <p className="admin-help">Enable Firestore and sign in to record purchases.</p> : null}
    </form>
  );
}
