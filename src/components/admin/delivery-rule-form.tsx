"use client";

import { useActionState } from "react";
import {
  type AdminFormAction,
  initialAdminActionState,
  type AdminActionState
} from "@/lib/admin/product-form";

export function CreateDeliveryRuleForm({
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
        <h2>New delivery rule</h2>
      </div>
      <form action={formAction} className="admin-form">
        <FormStatus state={state} />
        <fieldset disabled={disabled || pending}>
          <label className="admin-field">
            <span>Name</span>
            <input name="name" placeholder="East Legon" required />
          </label>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Type</span>
              <select defaultValue="LOCAL_DELIVERY" name="type">
                <option value="PICKUP">Pickup</option>
                <option value="LOCAL_DELIVERY">Local delivery</option>
                <option value="NATIONWIDE_DELIVERY">Nationwide delivery</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Fee GHS</span>
              <input inputMode="decimal" min="0" name="fee" placeholder="25.00" required />
            </label>
          </div>
          <label className="admin-field">
            <span>Regions (comma separated)</span>
            <input name="regions" placeholder="East Legon, Airport Residential" />
          </label>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Estimate</span>
              <input name="estimate" placeholder="1-2 days" />
            </label>
            <label className="admin-field">
              <span>Sort order</span>
              <input defaultValue="0" inputMode="numeric" min="0" name="sortOrder" />
            </label>
          </div>
          <button className="admin-action" type="submit">
            {pending ? "Creating" : "Create rule"}
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
