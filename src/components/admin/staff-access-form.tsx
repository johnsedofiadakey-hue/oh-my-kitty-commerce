"use client";

import { useActionState } from "react";
import { initialAdminActionState, type AdminFormAction } from "@/lib/admin/product-form";

export function StaffAccessForm({
  userId,
  displayName,
  email,
  roleIds,
  status,
  posEnabled,
  roles,
  disabled,
  updateStaffAccessAction
}: {
  userId: string;
  displayName: string;
  email: string;
  roleIds: string[];
  status: "ACTIVE" | "DEACTIVATED";
  posEnabled: boolean;
  roles: { id: string; name: string }[];
  disabled: boolean;
  updateStaffAccessAction: AdminFormAction;
}) {
  const [state, formAction, pending] = useActionState(updateStaffAccessAction, initialAdminActionState);

  return (
    <form action={formAction} className="quick-edit-row">
      <input name="id" type="hidden" value={userId} />
      <label className="admin-field">
        <span>Name</span>
        <input disabled value={displayName} />
      </label>
      <label className="admin-field">
        <span>Email</span>
        <input disabled value={email} />
      </label>
      <label className="admin-field">
        <span>Roles</span>
        <select defaultValue={roleIds} disabled={disabled || pending} multiple name="roleIds" required>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-field">
        <span>Status</span>
        <select defaultValue={status} disabled={disabled || pending} name="status">
          <option value="ACTIVE">Active</option>
          <option value="DEACTIVATED">Deactivated</option>
        </select>
      </label>
      <label className="admin-field checkbox">
        <input defaultChecked={posEnabled} disabled={disabled || pending} name="posEnabled" type="checkbox" />
        <span>Can use POS</span>
      </label>
      {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
      <button className="admin-action" disabled={disabled || pending} type="submit">
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
