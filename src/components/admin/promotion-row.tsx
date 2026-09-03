"use client";

import { useActionState } from "react";
import { initialAdminActionState, type AdminFormAction } from "@/lib/admin/product-form";

export function PromotionRow({
  id,
  code,
  channelRestrictions,
  type,
  value,
  active,
  requiresManagerApproval,
  disabled,
  updatePromotionAction
}: {
  id: string;
  code: string;
  channelRestrictions: string[];
  type: "PERCENT" | "AMOUNT";
  value: number;
  active: boolean;
  requiresManagerApproval: boolean;
  disabled: boolean;
  updatePromotionAction: AdminFormAction;
}) {
  const [state, formAction, pending] = useActionState(updatePromotionAction, initialAdminActionState);

  return (
    <form action={formAction} className="quick-edit-row">
      <input name="id" type="hidden" value={id} />
      <label className="admin-field">
        <span>Code</span>
        <input disabled value={code} />
      </label>
      <label className="admin-field">
        <span>Channels</span>
        <input disabled value={channelRestrictions.join(", ") || "All"} />
      </label>
      <label className="admin-field">
        <span>Value {type === "PERCENT" ? "(%)" : "(GHS)"}</span>
        <input defaultValue={value} disabled={disabled || pending} inputMode="decimal" min="0" name="value" required />
      </label>
      <label className="admin-field checkbox">
        <input defaultChecked={active} disabled={disabled || pending} name="active" type="checkbox" />
        <span>Active</span>
      </label>
      <label className="admin-field checkbox">
        <input
          defaultChecked={requiresManagerApproval}
          disabled={disabled || pending}
          name="requiresManagerApproval"
          type="checkbox"
        />
        <span>Requires approval</span>
      </label>
      {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
      <button className="admin-action" disabled={disabled || pending} type="submit">
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
