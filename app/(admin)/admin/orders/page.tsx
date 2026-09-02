import Image from "next/image";
import Link from "next/link";
import {
  formatDate,
  formatMoney,
  getAdminOperationsData,
  getOrderCustomerName,
  toSortableMillis
} from "@/lib/admin/operations-data";
import { formatFulfilmentStatus, formatPaymentStatus } from "@/lib/commerce/format";
import { requireAdminPermission } from "@/lib/auth/server";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { InlineStatusSelect } from "@/components/admin/inline-status-select";
import { DeleteOrderButton } from "@/components/admin/delete-order-button";
import type { AdminOrderRow } from "@/lib/admin/operations-data";
import type { Order } from "@/lib/commerce/types";
import { getEffectiveRoles } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { hasPermission } from "@/lib/permissions/permissions";
import { deleteOrderAction, updateOrderFulfilmentAction } from "./actions";

export const dynamic = "force-dynamic";

const fulfilmentStatuses = [
  "UNFULFILLED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "FULFILLED",
  "CANCELLED"
] as const;

const CHANNEL_FILTERS: { label: string; value: Order["channel"] | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Online", value: "ONLINE" },
  { label: "POS", value: "POS" },
  { label: "Admin-created", value: "ADMIN_CREATED" }
];

type AdminOrdersPageProps = {
  searchParams: Promise<{ channel?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const actor = await requireAdminPermission("orders.view");
  const context = getCommerceServerContext();
  const roles = context ? await getEffectiveRoles(context, actor.roleIds) : [];
  const canDelete = hasPermission(roles, actor, "orders.delete");
  const data = await getAdminOperationsData();
  const disabled = data.source !== "live";

  const { channel: channelParam } = await searchParams;
  const selectedChannel = CHANNEL_FILTERS.some((option) => option.value === channelParam)
    ? (channelParam as Order["channel"] | "all")
    : "all";
  const channelRows =
    selectedChannel === "all"
      ? data.orderRows
      : data.orderRows.filter((row) => row.order.channel === selectedChannel);

  // Oldest-first within "needs attention" — staff work the queue in the order
  // customers actually arrived in, same reasoning as a physical ticket queue.
  const needsAttention = channelRows
    .filter((row) => row.order.fulfilmentStatus !== "FULFILLED" && row.order.fulfilmentStatus !== "CANCELLED")
    .sort((a, b) => toSortableMillis(a.order.createdAt) - toSortableMillis(b.order.createdAt));
  const completed = channelRows
    .filter((row) => row.order.fulfilmentStatus === "FULFILLED" || row.order.fulfilmentStatus === "CANCELLED")
    .sort((a, b) => toSortableMillis(b.order.createdAt) - toSortableMillis(a.order.createdAt));

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Orders</h1>
          <p className="app-subtitle">Online, POS, and admin-created sales with separate status tracking.</p>
        </div>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}

      <div className="admin-chip-group" aria-label="Filter by channel">
        {CHANNEL_FILTERS.map((option) => {
          const count =
            option.value === "all"
              ? data.orderRows.length
              : data.orderRows.filter((row) => row.order.channel === option.value).length;
          return (
            <Link
              className="admin-chip-link"
              data-active={selectedChannel === option.value}
              href={option.value === "all" ? "/admin/orders" : `/admin/orders?channel=${option.value}`}
              key={option.value}
            >
              {option.label} <span>{count}</span>
            </Link>
          );
        })}
      </div>

      <section className="admin-panel">
        <div className="panel-header">
          <h2>Needs attention</h2>
          <span>{needsAttention.length} order{needsAttention.length === 1 ? "" : "s"} &middot; oldest first</span>
        </div>
        <div className="order-list">
          {needsAttention.map((row, index) => (
            <OrderRow canDelete={canDelete} disabled={disabled} key={row.order.id} queuePosition={index + 1} row={row} />
          ))}
          {needsAttention.length === 0 ? <p className="admin-help">Nothing waiting on you right now.</p> : null}
        </div>
      </section>

      <details className="admin-panel admin-collapsible">
        <summary className="panel-header">
          <h2>Completed</h2>
          <span>{completed.length} order{completed.length === 1 ? "" : "s"}</span>
        </summary>
        <div className="order-list">
          {completed.map((row) => (
            <OrderRow canDelete={canDelete} disabled={disabled} key={row.order.id} row={row} />
          ))}
          {completed.length === 0 ? <p className="admin-help">Nothing completed yet.</p> : null}
        </div>
      </details>
    </>
  );
}

function OrderRow({
  row,
  disabled,
  canDelete,
  queuePosition
}: {
  row: AdminOrderRow;
  disabled: boolean;
  canDelete: boolean;
  queuePosition?: number;
}) {
  const { order } = row;

  return (
    <div className="order-row">
      <AdminDrawer
        title={order.orderNumber}
        trigger={
          <div className="order-row-clickable">
            <div className="order-thumb" aria-hidden="true">
              {order.items[0]?.mediaUrl ? (
                <Image alt="" fill sizes="48px" src={order.items[0].mediaUrl} />
              ) : (
                <span className="order-thumb-empty" />
              )}
              {order.items.length > 1 ? (
                <span className="order-thumb-count">+{order.items.length - 1}</span>
              ) : null}
              {queuePosition ? <span className="order-queue-badge">{queuePosition}</span> : null}
            </div>
            <div className="order-row-main">
              <strong>{order.orderNumber}</strong>
              <span>{getOrderCustomerName(order)}</span>
            </div>
            <span className="order-row-channel">{order.channel.replace("_", " ")}</span>
            <StatusPill kind="payment" value={order.paymentStatus} />
          </div>
        }
      >
        <OrderDetail canDelete={canDelete} disabled={disabled} row={row} />
      </AdminDrawer>
      <InlineStatusSelect
        action={updateOrderFulfilmentAction}
        currentStatus={order.fulfilmentStatus}
        disabled={disabled}
        orderId={order.id}
      />
      <strong className="order-row-total">{formatMoney(order.total)}</strong>
    </div>
  );
}

function OrderDetail({ row, disabled, canDelete }: { row: AdminOrderRow; disabled: boolean; canDelete: boolean }) {
  const { order, payment } = row;
  const address = order.customerSnapshot?.address;
  const phone = order.customerSnapshot?.phone;
  const email = order.customerSnapshot?.email;
  const notes = order.customerSnapshot?.notes;

  return (
    <div className="order-detail">
      <section className="order-detail-section">
        <div className="order-detail-meta">
          <span>{formatDate(order.createdAt)}</span>
          <span>{order.channel.replace("_", " ")}</span>
          {payment ? <span>{payment.provider} &middot; {payment.method.replace("_", " ")}</span> : null}
        </div>
        <a className="admin-action ghost small" href={`/receipt/order/${order.id}`} rel="noopener" target="_blank">
          Print receipt
        </a>
      </section>

      <section className="order-detail-section">
        <h3>Customer</h3>
        <dl className="order-detail-dl">
          <div>
            <dt>Name</dt>
            <dd>{getOrderCustomerName(order)}</dd>
          </div>
          {phone ? (
            <div>
              <dt>Phone</dt>
              <dd>{phone}</dd>
            </div>
          ) : null}
          {email ? (
            <div>
              <dt>Email</dt>
              <dd>{email}</dd>
            </div>
          ) : null}
          {address ? (
            <div>
              <dt>Delivery address</dt>
              <dd>{address}</dd>
            </div>
          ) : null}
          {notes ? (
            <div>
              <dt>Notes</dt>
              <dd>{notes}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="order-detail-section">
        <h3>Items</h3>
        <div className="order-detail-items">
          {order.items.map((item, index) => (
            <div className="order-detail-item" key={index}>
              <div className="order-detail-item-thumb" aria-hidden="true">
                {item.mediaUrl ? <Image alt="" fill sizes="64px" src={item.mediaUrl} /> : null}
              </div>
              <div className="order-detail-item-info">
                <strong>{item.productTitle}</strong>
                <span>
                  {item.variantTitle} &times; {item.quantity}
                </span>
              </div>
              <span className="order-detail-item-total">{formatMoney(item.lineTotal)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="order-detail-section">
        <dl className="order-detail-totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatMoney(order.subtotal)}</dd>
          </div>
          {order.discountTotal > 0 ? (
            <div>
              <dt>Discount</dt>
              <dd>-{formatMoney(order.discountTotal)}</dd>
            </div>
          ) : null}
          {order.deliveryTotal > 0 ? (
            <div>
              <dt>Delivery</dt>
              <dd>{formatMoney(order.deliveryTotal)}</dd>
            </div>
          ) : null}
          {order.taxTotal > 0 ? (
            <div>
              <dt>Tax</dt>
              <dd>{formatMoney(order.taxTotal)}</dd>
            </div>
          ) : null}
          <div className="order-detail-grand-total">
            <dt>Total</dt>
            <dd>{formatMoney(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="order-detail-section">
        <h3>Fulfilment</h3>
        <form action={updateOrderFulfilmentAction} className="order-detail-fulfilment-form">
          <input name="id" type="hidden" value={order.id} />
          <label className="admin-field">
            <span>Status</span>
            <select defaultValue={order.fulfilmentStatus} disabled={disabled} name="fulfilmentStatus">
              {fulfilmentStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatFulfilmentStatus(status)}
                </option>
              ))}
            </select>
          </label>
          <button className="admin-action" disabled={disabled} type="submit">
            Save
          </button>
        </form>
      </section>

      {canDelete ? (
        <section className="order-detail-section">
          <h3>Danger zone</h3>
          <DeleteOrderButton
            action={deleteOrderAction}
            disabled={disabled}
            orderId={order.id}
            orderNumber={order.orderNumber}
          />
        </section>
      ) : null}
    </div>
  );
}

function StatusPill({ kind, value }: { kind: "payment" | "fulfilment"; value: string }) {
  const tone =
    kind === "payment"
      ? value === "PAID"
        ? "good"
        : value === "REFUNDED" || value === "FAILED"
          ? "urgent"
          : "warn"
      : value === "FULFILLED"
        ? "good"
        : value === "CANCELLED"
          ? "urgent"
          : value === "UNFULFILLED"
            ? "warn"
            : "neutral";

  const label = kind === "payment" ? formatPaymentStatus(value) : formatFulfilmentStatus(value);
  return <span className={`order-status-pill ${tone}`}>{label}</span>;
}
