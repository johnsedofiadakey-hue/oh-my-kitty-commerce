import { getAdminOperationsData } from "@/lib/admin/operations-data";
import { formatDate } from "@/lib/admin/sample-admin-data";
import { requireAdminPermission } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requireAdminPermission("audit.view");
  const data = await getAdminOperationsData();

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Audit</h1>
          <p className="app-subtitle">Privileged product, order, inventory, user, role, and POS activity.</p>
        </div>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Audit log</h2>
          <span>{data.auditLogs.length} events</span>
        </div>
        <div className="admin-table">
          <div className="admin-table-row header">
            <span>Action</span>
            <span>Actor</span>
            <span>Entity</span>
            <span>Summary</span>
            <span>Time</span>
          </div>
          {data.auditLogs.map((log) => (
            <div className="admin-table-row" key={log.id}>
              <strong>{log.action}</strong>
              <span>{log.actorId}</span>
              <span>
                {log.entityType} / {log.entityId}
              </span>
              <span>{log.summary}</span>
              <span>{formatDate(log.createdAt)}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
