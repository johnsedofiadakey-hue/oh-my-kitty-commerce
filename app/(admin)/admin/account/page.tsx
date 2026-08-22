import { getRequiredAdminActor } from "@/lib/auth/server";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { logPasswordChangeAction } from "./actions";

export default async function AdminAccountPage() {
  const actor = await getRequiredAdminActor();

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">My Account</h1>
          <p className="app-subtitle">Manage your own sign-in — available to every staff account.</p>
        </div>
      </div>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Signed in as</h2>
        </div>
        <div className="admin-table two">
          <div className="admin-table-row">
            <strong>Email</strong>
            <span>{actor.email ?? "—"}</span>
          </div>
          <div className="admin-table-row">
            <strong>Name</strong>
            <span>{actor.displayName ?? "—"}</span>
          </div>
        </div>
      </section>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Change password</h2>
          <span>Signs you out everywhere else</span>
        </div>
        {actor.email ? (
          <ChangePasswordForm email={actor.email} onPasswordChanged={logPasswordChangeAction} />
        ) : (
          <p className="admin-help">No email on file for this account — contact an owner.</p>
        )}
      </section>
    </>
  );
}
