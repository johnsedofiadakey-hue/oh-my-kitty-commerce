"use client";

import { useActionState } from "react";
import {
  type AdminFormAction,
  initialAdminActionState,
  type AdminActionState
} from "@/lib/admin/product-form";

type RoleOption = {
  id: string;
  name: string;
};

type StaffManagementFormsProps = {
  inviteStaffAction: AdminFormAction;
  roles: RoleOption[];
  disabled: boolean;
};

export function StaffManagementForms({ inviteStaffAction, roles, disabled }: StaffManagementFormsProps) {
  const [state, formAction, pending] = useActionState(inviteStaffAction, initialAdminActionState);

  return (
    <section className="admin-panel">
      <div className="panel-header">
        <h2>Invite staff</h2>
        <span>Creates a sign-in and assigns access</span>
      </div>
      <form action={formAction} className="admin-form">
        <FormStatus state={state} />
        <fieldset disabled={disabled || pending}>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Name</span>
              <input name="displayName" placeholder="Ama Mensah" required />
            </label>
            <label className="admin-field">
              <span>Email</span>
              <input name="email" placeholder="ama@ohmykitty.example" required type="email" />
            </label>
          </div>
          <label className="admin-field">
            <span>Roles</span>
            <select multiple name="roleIds" required>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field checkbox">
            <input name="posEnabled" type="checkbox" />
            <span>Can use POS</span>
          </label>
          <button className="admin-action" type="submit">
            {pending ? "Inviting" : "Invite staff"}
          </button>
        </fieldset>
        {disabled ? <p className="admin-help">Enable Firestore and sign in to invite staff.</p> : null}
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
