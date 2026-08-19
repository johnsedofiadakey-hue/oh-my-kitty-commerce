import { getAdminStaffData } from "@/lib/admin/staff";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { StaffManagementForms } from "@/components/admin/staff-management-forms";
import { requireAdminPermission } from "@/lib/auth/server";
import { inviteStaffAction, updateStaffAccessAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdminPermission("users.view");
  const data = await getAdminStaffData();
  const disabled = data.source !== "live";

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Users & Roles</h1>
          <p className="app-subtitle">Admin-created staff accounts, POS access, and RBAC permissions.</p>
        </div>
        <AdminDrawer title="Invite staff" triggerLabel="Invite staff">
          <StaffManagementForms
            disabled={disabled}
            inviteStaffAction={inviteStaffAction}
            roles={data.roles.map((role) => ({ id: role.id, name: role.name }))}
          />
        </AdminDrawer>
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
            <form action={updateStaffAccessAction} className="quick-edit-row" key={user.id}>
              <input name="id" type="hidden" value={user.id} />
              <label className="admin-field">
                <span>Name</span>
                <input disabled value={user.displayName} />
              </label>
              <label className="admin-field">
                <span>Email</span>
                <input disabled value={user.email} />
              </label>
              <label className="admin-field">
                <span>Roles</span>
                <select defaultValue={user.roleIds} disabled={disabled} multiple name="roleIds" required>
                  {data.roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>Status</span>
                <select defaultValue={user.status} disabled={disabled} name="status">
                  <option value="ACTIVE">Active</option>
                  <option value="DEACTIVATED">Deactivated</option>
                </select>
              </label>
              <label className="admin-field checkbox">
                <input
                  defaultChecked={user.posEnabled}
                  disabled={disabled}
                  name="posEnabled"
                  type="checkbox"
                />
                <span>Can use POS</span>
              </label>
              <button className="admin-action" disabled={disabled} type="submit">
                Save
              </button>
            </form>
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
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
