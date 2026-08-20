"use client";

import { useActionState } from "react";
import {
  type AdminFormAction,
  initialAdminActionState,
  type AdminActionState
} from "@/lib/admin/product-form";

export function CategoryManagementForm({
  createCategoryAction,
  disabled
}: {
  createCategoryAction: AdminFormAction;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(createCategoryAction, initialAdminActionState);

  return (
    <section className="admin-panel no-margin">
      <form action={formAction} className="admin-form">
        <FormStatus state={state} />
        <fieldset disabled={disabled || pending}>
          <label className="admin-field">
            <span>Title</span>
            <input name="title" placeholder="Period Care Sets" required />
          </label>
          <label className="admin-field">
            <span>URL slug</span>
            <input name="slug" placeholder="auto from title" />
          </label>
          <label className="admin-field">
            <span>Description</span>
            <input name="description" placeholder="Optional" />
          </label>
          <label className="admin-field">
            <span>Sort order</span>
            <input defaultValue="0" inputMode="numeric" min="0" name="sortOrder" />
          </label>
          <button className="admin-action" type="submit">
            {pending ? "Creating" : "Create"}
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
