"use client";

import { useActionState } from "react";
import { initialAdminActionState, type AdminFormAction } from "@/lib/admin/product-form";

export function DeleteRoleButton({
  roleId,
  disabled,
  deleteRoleAction
}: {
  roleId: string;
  disabled: boolean;
  deleteRoleAction: AdminFormAction;
}) {
  const [state, formAction, pending] = useActionState(deleteRoleAction, initialAdminActionState);

  return (
    <form action={formAction}>
      <input name="id" type="hidden" value={roleId} />
      {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
      <button className="admin-action ghost small" disabled={disabled || pending} type="submit">
        {pending ? "Deleting..." : "Delete"}
      </button>
    </form>
  );
}
