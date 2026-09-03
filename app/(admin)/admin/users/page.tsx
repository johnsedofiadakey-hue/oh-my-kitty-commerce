import { getAdminStaffData } from "@/lib/admin/staff";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { StaffManagementForms } from "@/components/admin/staff-management-forms";
import { RoleManagementForm } from "@/components/admin/role-management-form";
import { ResetStaffPasswordButton } from "@/components/admin/reset-staff-password-button";
import { DeleteStaffButton } from "@/components/admin/delete-staff-button";
import { StaffAccessForm } from "@/components/admin/staff-access-form";
import { DeleteRoleButton } from "@/components/admin/delete-role-button";
import { requireAdminPermission } from "@/lib/auth/server";
import {
  createRoleAction,
  deleteRoleAction,
  deleteStaffUserAction,
  inviteStaffAction,
  resetStaffPasswordAction,
  updateRoleAction,
  updateStaffAccessAction
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const actor = await requireAdminPermission("users.view");
  const data = await getAdminStaffData();
  const disabled = data.source !== "live";

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Users & Roles</h1>
          <p className="app-subtitle">Admin-created staff accounts, POS access, and RBAC permissions.</p>
        </div>
        <div className="page-heading-actions">
          <AdminDrawer title="New role" triggerLabel="New role" triggerClassName="admin-action ghost">
            <RoleManagementForm action={createRoleAction} disabled={disabled} />
          </AdminDrawer>
          <AdminDrawer title="Invite staff" triggerLabel="Invite staff">
            <StaffManagementForms
              disabled={disabled}
              inviteStaffAction={inviteStaffAction}
              roles={data.roles.map((role) => ({ id: role.id, name: role.name }))}
            />
          </AdminDrawer>
        </div>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Users</h2>
          <span>{data.users.length} accounts</span>
        </div>
        <div className="quick-edit-list">
          {data.users.map((user) => (
            <div key={user.id}>
              <StaffAccessForm
                disabled={disabled}
                displayName={user.displayName}
                email={user.email}
                posEnabled={user.posEnabled}
                roleIds={user.roleIds}
                roles={data.roles.map((role) => ({ id: role.id, name: role.name }))}
                status={user.status}
                updateStaffAccessAction={updateStaffAccessAction}
                userId={user.id}
              />
              <ResetStaffPasswordButton action={resetStaffPasswordAction} disabled={disabled} userId={user.id} />
              {user.id !== actor.uid ? (
                <DeleteStaffButton
                  action={deleteStaffUserAction}
                  disabled={disabled}
                  staffEmail={user.email}
                  staffId={user.id}
                />
              ) : null}
            </div>
          ))}
          {data.users.length === 0 ? <p className="admin-help">No staff accounts yet.</p> : null}
        </div>
      </section>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Roles</h2>
          <span>{data.roles.length} role templates</span>
        </div>
        <div className="stack-list">
          {data.roles.map((role) => (
            <div className="stack-row" key={role.id}>
              <strong>{role.name}</strong>
              <span>{role.permissions.length} permissions</span>
              {role.system ? (
                <span className="admin-help">Built-in</span>
              ) : (
                <div className="stack-row-actions">
                  <AdminDrawer
                    title={`Edit ${role.name}`}
                    triggerClassName="admin-action ghost small"
                    triggerLabel="Edit"
                  >
                    <RoleManagementForm action={updateRoleAction} disabled={disabled} role={role} />
                  </AdminDrawer>
                  <DeleteRoleButton deleteRoleAction={deleteRoleAction} disabled={disabled} roleId={role.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
