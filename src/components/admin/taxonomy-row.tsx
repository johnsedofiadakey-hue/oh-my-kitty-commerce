"use client";

import { useActionState } from "react";
import { initialAdminActionState, type AdminFormAction } from "@/lib/admin/product-form";

export function TaxonomyRow({
  id,
  title,
  slug,
  sortOrder,
  active,
  disabled,
  action
}: {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  active: boolean;
  disabled: boolean;
  action: AdminFormAction;
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);

  return (
    <form action={formAction} className="quick-edit-row">
      <input name="id" type="hidden" value={id} />
      <label className="admin-field">
        <span>Title</span>
        <input defaultValue={title} disabled={disabled || pending} name="title" required />
      </label>
      <label className="admin-field">
        <span>Slug</span>
        <input disabled value={slug} />
      </label>
      <label className="admin-field">
        <span>Sort order</span>
        <input defaultValue={sortOrder} disabled={disabled || pending} inputMode="numeric" min="0" name="sortOrder" />
      </label>
      <label className="admin-field checkbox">
        <input defaultChecked={active} disabled={disabled || pending} name="active" type="checkbox" />
        <span>Active</span>
      </label>
      {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
      <button className="admin-action" disabled={disabled || pending} type="submit">
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
