"use client";

import { useActionState } from "react";
import { initialAdminActionState, type AdminFormAction } from "@/lib/admin/product-form";
import type { DeliveryRule } from "@/lib/commerce/types";

export function DeliveryRuleRow({
  id,
  name,
  type,
  regions,
  fee,
  estimate,
  sortOrder,
  active,
  disabled,
  quickEditDeliveryRuleAction
}: {
  id: string;
  name: string;
  type: DeliveryRule["type"];
  regions: string[];
  fee: number;
  estimate?: string;
  sortOrder: number;
  active: boolean;
  disabled: boolean;
  quickEditDeliveryRuleAction: AdminFormAction;
}) {
  const [state, formAction, pending] = useActionState(quickEditDeliveryRuleAction, initialAdminActionState);

  return (
    <form action={formAction} className="quick-edit-row">
      <input name="id" type="hidden" value={id} />
      <label className="admin-field">
        <span>Name</span>
        <input defaultValue={name} disabled={disabled || pending} name="name" required />
      </label>
      <label className="admin-field">
        <span>Type</span>
        <input disabled value={type.replaceAll("_", " ")} />
      </label>
      <label className="admin-field">
        <span>Regions</span>
        <input disabled value={regions.join(", ") || "All"} />
      </label>
      <label className="admin-field">
        <span>Fee GHS</span>
        <input
          defaultValue={(fee / 100).toFixed(2)}
          disabled={disabled || pending}
          inputMode="decimal"
          min="0"
          name="fee"
          required
        />
      </label>
      <label className="admin-field">
        <span>Estimate</span>
        <input defaultValue={estimate ?? ""} disabled={disabled || pending} name="estimate" />
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
