import { adminData, getRoleNames } from "@/lib/admin/sample-admin-data";

export default function AdminUsersPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Users & Roles</h1>
          <p className="app-subtitle">Admin-created staff accounts, POS access, and RBAC permissions.</p>
        </div>
        <button className="admin-action" type="button">
          Invite staff
        </button>
      </div>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Users</h2>
          <span>{adminData.users.length} active accounts</span>
        </div>
        <div className="admin-table">
          <div className="admin-table-row header">
            <span>Name</span>
            <span>Email</span>
            <span>Roles</span>
            <span>POS</span>
            <span>Status</span>
          </div>
          {adminData.users.map((user) => (
            <div className="admin-table-row" key={user.uid}>
              <strong>{user.displayName}</strong>
              <span>{user.email}</span>
              <span>{getRoleNames(user.roleIds)}</span>
              <span>{user.posEnabled ? "Enabled" : "Disabled"}</span>
              <span>{user.status}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Roles</h2>
          <span>{adminData.roles.length} role templates</span>
        </div>
        <div className="stack-list">
          {adminData.roles.map((role) => (
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
