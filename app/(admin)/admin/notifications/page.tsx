import Link from "next/link";
import { getAdminOperationsData } from "@/lib/admin/operations-data";
import { formatDate } from "@/lib/admin/sample-admin-data";
import { requireAdminPermission } from "@/lib/auth/server";
import { AcknowledgeNotificationButton } from "@/components/admin/acknowledge-notification-button";
import { buildGuidanceReplyPrefill, toWhatsAppLink } from "@/lib/storefront/whatsapp";
import type { NotificationLog } from "@/lib/commerce/types";
import { acknowledgeNotificationAction } from "./actions";

export const dynamic = "force-dynamic";

function NotificationSource({ log }: { log: NotificationLog }) {
  if (log.entityType === "guidanceRequest" && log.contactNumber) {
    return (
      <a href={toWhatsAppLink(log.contactNumber, buildGuidanceReplyPrefill(log.body))} rel="noreferrer" target="_blank">
        {log.contactNumber}
      </a>
    );
  }

  return <Link href="/admin/orders">{log.entityRef}</Link>;
}

export default async function AdminNotificationsPage() {
  await requireAdminPermission("notifications.view");
  const data = await getAdminOperationsData();
  const disabled = data.source !== "live";

  const pending = data.notificationLogs.filter((log) => !log.acknowledged);
  const acknowledged = data.notificationLogs.filter((log) => log.acknowledged);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Notifications</h1>
          <p className="app-subtitle">
            New website orders and guidance requests that came in while nobody was watching.
          </p>
        </div>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Needs attention</h2>
          <span>{pending.length} unacknowledged</span>
        </div>
        <div className="admin-table">
          <div className="admin-table-row header">
            <span>From</span>
            <span>Details</span>
            <span>Time</span>
            <span>Action</span>
          </div>
          {pending.map((log) => (
            <div className="admin-table-row" key={log.id}>
              <strong>
                <NotificationSource log={log} />
              </strong>
              <span>{log.body}</span>
              <span>{formatDate(log.createdAt)}</span>
              <AcknowledgeNotificationButton
                acknowledgeNotificationAction={acknowledgeNotificationAction}
                disabled={disabled}
                notificationId={log.id}
              />
            </div>
          ))}
          {pending.length === 0 ? <p className="admin-help">Nothing waiting on you right now.</p> : null}
        </div>
      </section>

      <details className="admin-panel admin-collapsible">
        <summary className="panel-header">
          <h2>Acknowledged</h2>
          <span>{acknowledged.length}</span>
        </summary>
        <div className="admin-table">
          <div className="admin-table-row header">
            <span>From</span>
            <span>Details</span>
            <span>Time</span>
            <span>Acknowledged by</span>
          </div>
          {acknowledged.map((log) => (
            <div className="admin-table-row" key={log.id}>
              <strong>
                <NotificationSource log={log} />
              </strong>
              <span>{log.body}</span>
              <span>{formatDate(log.createdAt)}</span>
              <span>{log.acknowledgedBy ?? "—"}</span>
            </div>
          ))}
          {acknowledged.length === 0 ? <p className="admin-help">Nothing acknowledged yet.</p> : null}
        </div>
      </details>
    </>
  );
}
