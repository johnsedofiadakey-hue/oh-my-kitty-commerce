"use client";

import { useActionState } from "react";
import {
  type AdminFormAction,
  initialAdminActionState,
  type AdminActionState
} from "@/lib/admin/product-form";

export function CreatePromotionForm({
  action,
  disabled
}: {
  action: AdminFormAction;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);

  return (
    <section className="admin-panel">
      <div className="panel-header">
        <h2>New promotion</h2>
      </div>
      <form action={formAction} className="admin-form">
        <FormStatus state={state} />
        <fieldset disabled={disabled || pending}>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Code</span>
              <input name="code" placeholder="WELCOME10" required />
            </label>
            <label className="admin-field">
              <span>Type</span>
              <select defaultValue="PERCENT" name="type">
                <option value="PERCENT">Percent off</option>
                <option value="AMOUNT">Amount off (GHS)</option>
              </select>
            </label>
          </div>
          <label className="admin-field">
            <span>Value</span>
            <input inputMode="decimal" min="0" name="value" placeholder="10" required />
          </label>
          <label className="admin-field checkbox">
            <input name="requiresManagerApproval" type="checkbox" />
            <span>Requires manager approval</span>
          </label>
          <button className="admin-action" type="submit">
            {pending ? "Creating" : "Create promotion"}
          </button>
        </fieldset>
        {disabled ? <p className="admin-help">Enable Firestore and sign in to save.</p> : null}
      </form>
    </section>
  );
}

function FormStatus({ state }: { state: AdminActionState }) {
  if (!state.message) {
    return null;
  }

  return <p className={`admin-form-status ${state.status}`}>{state.message}</p>;
}
