"use client";

import { useActionState } from "react";
import { initialAdminActionState, type AdminFormAction } from "@/lib/admin/product-form";

export function CustomerRow({
  id,
  name,
  phone,
  email,
  createdFrom,
  disabled,
  orderCount,
  orderTotalLabel,
  updateCustomerAction
}: {
  id: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  createdFrom: string;
  disabled: boolean;
  orderCount: number;
  orderTotalLabel: string;
  updateCustomerAction: AdminFormAction;
}) {
  const [state, formAction, pending] = useActionState(updateCustomerAction, initialAdminActionState);

  return (
    <form action={formAction} className="quick-edit-row">
      <input name="id" type="hidden" value={id} />
      <label className="admin-field">
        <span>Name</span>
        <input defaultValue={name ?? ""} disabled={disabled || pending} name="name" />
      </label>
      <label className="admin-field">
        <span>Phone</span>
        <input defaultValue={phone ?? ""} disabled={disabled || pending} name="phone" />
      </label>
      <label className="admin-field">
        <span>Email</span>
        <input defaultValue={email ?? ""} disabled={disabled || pending} name="email" type="email" />
      </label>
      <label className="admin-field">
        <span>Source</span>
        <input disabled value={createdFrom} />
      </label>
      <label className="admin-field">
        <span>Orders</span>
        <input disabled value={`${orderCount} / ${orderTotalLabel}`} />
      </label>
      {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
      <button className="admin-action" disabled={disabled || pending} type="submit">
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
