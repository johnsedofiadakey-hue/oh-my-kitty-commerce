import Image from "next/image";
import {
  formatDate,
  formatMoney,
  getAdminOperationsData,
  getOrderCustomerName,
} from "@/lib/admin/operations-data";
import { requireAdminPermission } from "@/lib/auth/server";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import type { AdminOrderRow } from "@/lib/admin/operations-data";
import { updateOrderFulfilmentAction } from "./actions";

export const dynamic = "force-dynamic";

const fulfilmentStatuses = [
  "UNFULFILLED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "FULFILLED",
  "CANCELLED"
] as const;

export default async function AdminOrdersPage() {
  await requireAdminPermission("orders.view");
  const data = await getAdminOperationsData();
  const rows = data.orderRows;
  const disabled = data.source !== "live";

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
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Order queue</h2>
          <span>{rows.length} orders</span>
        </div>
        <div className="order-list">
          {rows.map((row) => (
            <OrderRow disabled={disabled} key={row.order.id} row={row} />
          ))}
          {rows.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
        </div>
      </section>
    </>
  );
}

function OrderRow({ row, disabled }: { row: AdminOrderRow; disabled: boolean }) {
  const { order } = row;

  return (
    <AdminDrawer
      title={order.orderNumber}
      trigger={
        <div className="order-row">
          <div className="order-thumb" aria-hidden="true">
            {order.items[0]?.mediaUrl ? (
              <Image alt="" fill sizes="48px" src={order.items[0].mediaUrl} />
            ) : (
              <span className="order-thumb-empty" />
            )}
            {order.items.length > 1 ? (
              <span className="order-thumb-count">+{order.items.length - 1}</span>
            ) : null}
          </div>
          <div className="order-row-main">
            <strong>{order.orderNumber}</strong>
            <span>{getOrderCustomerName(order)}</span>
          </div>
          <span className="order-row-channel">{order.channel.replace("_", " ")}</span>
          <div className="order-row-badges">
            <StatusPill kind="payment" value={order.paymentStatus} />
            <StatusPill kind="fulfilment" value={order.fulfilmentStatus} />
          </div>
          <strong className="order-row-total">{formatMoney(order.total)}</strong>
        </div>
      }
    >
      <OrderDetail disabled={disabled} row={row} />
    </AdminDrawer>
  );
}

function OrderDetail({ row, disabled }: { row: AdminOrderRow; disabled: boolean }) {
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
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <button className="admin-action" disabled={disabled} type="submit">
            Save
          </button>
        </form>
      </section>
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

  return <span className={`order-status-pill ${tone}`}>{value.replaceAll("_", " ")}</span>;
}
