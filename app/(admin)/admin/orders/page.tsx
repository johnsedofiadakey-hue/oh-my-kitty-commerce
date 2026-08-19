import Image from "next/image";
import {
  formatMoney,
  getAdminOperationsData,
  getOrderCustomerName,
} from "@/lib/admin/operations-data";
import { requireAdminPermission } from "@/lib/auth/server";
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
        <div className="quick-edit-list">
          {rows.map(({ order }) => (
            <form action={updateOrderFulfilmentAction} className="quick-edit-row" key={order.id}>
              <input name="id" type="hidden" value={order.id} />
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
              <label className="admin-field">
                <span>Order</span>
                <input disabled value={order.orderNumber} />
              </label>
              <label className="admin-field">
                <span>Customer</span>
                <input disabled value={getOrderCustomerName(order)} />
              </label>
              <label className="admin-field">
                <span>Channel</span>
                <input disabled value={order.channel.replace("_", " ")} />
              </label>
              <label className="admin-field">
                <span>Payment</span>
                <input disabled value={order.paymentStatus} />
              </label>
              <label className="admin-field">
                <span>Fulfilment status</span>
                <select defaultValue={order.fulfilmentStatus} disabled={disabled} name="fulfilmentStatus">
                  {fulfilmentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>Total</span>
                <input disabled value={formatMoney(order.total)} />
              </label>
              <button className="admin-action" disabled={disabled} type="submit">
                Save
              </button>
            </form>
          ))}
          {rows.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
        </div>
      </section>
    </>
  );
}
