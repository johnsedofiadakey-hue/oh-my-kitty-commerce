"use client";

import { useActionState } from "react";
import {
  type AdminFormAction,
  initialAdminActionState,
  type AdminActionState
} from "@/lib/admin/product-form";

export function CreateCustomerForm({
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
        <h2>New customer</h2>
      </div>
      <form action={formAction} className="admin-form">
        <FormStatus state={state} />
        <fieldset disabled={disabled || pending}>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Name</span>
              <input name="name" placeholder="Ama Owusu" />
            </label>
            <label className="admin-field">
              <span>Phone</span>
              <input name="phone" placeholder="0241448231" />
            </label>
          </div>
          <label className="admin-field">
            <span>Email</span>
            <input name="email" placeholder="Optional" type="email" />
          </label>
          <button className="admin-action" type="submit">
            {pending ? "Creating" : "Create customer"}
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
