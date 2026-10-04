"use client";

import { useActionState } from "react";
import { PendingSubmitButton } from "@/components/admin/pending-submit-button";
import { RequestIdField } from "@/components/admin/request-id-field";
import {
  initialAdminActionState,
  type AdminActionState,
  type AdminFormAction
} from "@/lib/admin/product-form";

type StockAdjustFormProps = {
  action: AdminFormAction;
  currentStock: number;
  disabled: boolean;
  productId: string;
  variantId: string;
};

// The "Adjust stock" form. It says plainly what happened — saved (with the new
// number) or not saved (and why) — so nobody has to guess whether a click
// worked and press Save again.
export function StockAdjustForm({ action, currentStock, disabled, productId, variantId }: StockAdjustFormProps) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(action, initialAdminActionState);

  return (
    <form action={formAction} className="admin-form">
      <input name="productId" type="hidden" value={productId} />
      <input name="variantId" type="hidden" value={variantId} />
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
          <span>Quantity change (you have {currentStock} now)</span>
          <input name="quantityDelta" placeholder="e.g. 10 to add, -2 to remove" required type="number" />
        </label>
        <label className="admin-field">
          <span>Reason</span>
          <input minLength={3} name="reason" placeholder="Restock delivery" required />
        </label>
        {state.message ? (
          <p aria-live="polite" className={`admin-form-status ${state.status}`} role="status">
            {state.message}
          </p>
        ) : null}
        <PendingSubmitButton>Save adjustment</PendingSubmitButton>
      </fieldset>
    </form>
  );
}
