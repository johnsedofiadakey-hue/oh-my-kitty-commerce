"use client";

import { useActionState } from "react";
import {
  type AdminFormAction,
  initialAdminActionState,
  type AdminActionState
} from "@/lib/admin/product-form";

type TaxonomyManagementFormsProps = {
  createConcernAction: AdminFormAction;
  createProductTypeAction: AdminFormAction;
  createRoutineAction: AdminFormAction;
  disabled: boolean;
};

export function TaxonomyManagementForms({
  createConcernAction,
  createProductTypeAction,
  createRoutineAction,
  disabled
}: TaxonomyManagementFormsProps) {
  return (
    <section className="admin-grid two">
      <CreateTaxonomyForm
        action={createConcernAction}
        disabled={disabled}
        placeholder="Freshness & odour care"
        title="New concern / need"
      />
      <CreateTaxonomyForm
        action={createProductTypeAction}
        disabled={disabled}
        placeholder="Oils"
        title="New product type"
      />
      <CreateTaxonomyForm
        action={createRoutineAction}
        disabled={disabled}
        placeholder="Night routine"
        title="New routine"
      />
    </section>
  );
}

function CreateTaxonomyForm({
  action,
  disabled,
  placeholder,
  title
}: {
  action: AdminFormAction;
  disabled: boolean;
  placeholder: string;
  title: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);

  return (
    <section className="admin-panel">
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      <form action={formAction} className="admin-form">
        <FormStatus state={state} />
        <fieldset disabled={disabled || pending}>
          <label className="admin-field">
            <span>Title</span>
            <input name="title" placeholder={placeholder} required />
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
