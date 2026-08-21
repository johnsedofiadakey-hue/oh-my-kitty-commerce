"use client";

import { useActionState } from "react";
import {
  type AdminFormAction,
  initialAdminActionState,
  type AdminActionState
} from "@/lib/admin/product-form";
import { permissions, type Role } from "@/lib/permissions/permissions";

const PERMISSION_GROUPS = [
  { label: "Admin", prefix: "admin." },
  { label: "Dashboard", prefix: "dashboard." },
  { label: "Products", prefix: "products." },
  { label: "Media", prefix: "media." },
  { label: "Content", prefix: "content." },
  { label: "Orders", prefix: "orders." },
  { label: "Fulfilment", prefix: "fulfilment." },
  { label: "Inventory", prefix: "inventory." },
  { label: "Customers", prefix: "customers." },
  { label: "Promotions", prefix: "promotions." },
  { label: "Reports", prefix: "reports." },
  { label: "POS", prefix: "pos." },
  { label: "Users", prefix: "users." },
  { label: "Roles", prefix: "roles." },
  { label: "Settings", prefix: "settings." },
  { label: "Audit", prefix: "audit." }
]
  .map((group) => ({
    label: group.label,
    items: permissions.filter((permission) => permission.startsWith(group.prefix))
  }))
  .filter((group) => group.items.length > 0);

type RoleManagementFormProps = {
  action: AdminFormAction;
  role?: Role;
  disabled: boolean;
};

export function RoleManagementForm({ action, role, disabled }: RoleManagementFormProps) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);
  const selectedPermissions = new Set(role?.permissions ?? []);

  return (
    <form action={formAction} className="admin-form">
      <FormStatus state={state} />
      <fieldset disabled={disabled || pending}>
        {role ? <input name="id" type="hidden" value={role.id} /> : null}
        <label className="admin-field">
          <span>Role name</span>
          <input defaultValue={role?.name} name="name" placeholder="Warehouse Lead" required />
        </label>
        <div className="role-permission-groups">
          {PERMISSION_GROUPS.map((group) => (
            <fieldset className="role-permission-group" key={group.label}>
              <legend>{group.label}</legend>
              {group.items.map((permission) => (
                <label className="admin-field checkbox" key={permission}>
                  <input
                    defaultChecked={selectedPermissions.has(permission)}
                    name="permissions"
                    type="checkbox"
                    value={permission}
                  />
                  <span>{permission}</span>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Max discount % at POS</span>
            <input
              defaultValue={role?.limits?.maxDiscountPercent}
              max={100}
              min={0}
              name="maxDiscountPercent"
              type="number"
            />
          </label>
          <label className="admin-field">
            <span>Max refund GHS at POS (blank = no limit)</span>
            <input
              defaultValue={
                role?.limits?.maxRefundAmount !== undefined
                  ? (role.limits.maxRefundAmount / 100).toFixed(2)
                  : undefined
              }
              name="maxRefundAmount"
            />
          </label>
        </div>
        <label className="admin-field checkbox">
          <input defaultChecked={role?.limits?.canOverridePrice} name="canOverridePrice" type="checkbox" />
          <span>Can override prices at POS</span>
        </label>
        <button className="admin-action" type="submit">
          {pending ? "Saving" : role ? "Save role" : "Create role"}
        </button>
      </fieldset>
      {disabled ? <p className="admin-help">Enable Firestore and sign in to manage roles.</p> : null}
    </form>
  );
}

function FormStatus({ state }: { state: AdminActionState }) {
  if (!state.message) {
    return null;
  }

  return <p className={`admin-form-status ${state.status}`}>{state.message}</p>;
}
