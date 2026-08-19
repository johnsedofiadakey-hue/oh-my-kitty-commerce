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
        <div className="admin-table six">
          <div className="admin-table-row header">
            <span>Order</span>
            <span>Customer</span>
            <span>Channel</span>
            <span>Payment</span>
            <span>Fulfilment</span>
            <span>Total</span>
          </div>
          {rows.map(({ order }) => (
            <div className="admin-table-row" key={order.id}>
              <strong>{order.orderNumber}</strong>
              <span>{getOrderCustomerName(order)}</span>
              <span>{order.channel.replace("_", " ")}</span>
              <span>{order.paymentStatus}</span>
              <span>{order.fulfilmentStatus.replaceAll("_", " ")}</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Update fulfilment</h2>
          <span>{rows.length} orders</span>
        </div>
        <div className="quick-edit-list">
          {rows.map(({ order }) => (
            <form action={updateOrderFulfilmentAction} className="quick-edit-row" key={order.id}>
              <input name="id" type="hidden" value={order.id} />
              <label className="admin-field">
                <span>Order</span>
                <input disabled value={order.orderNumber} />
              </label>
              <label className="admin-field">
                <span>Customer</span>
                <input disabled value={getOrderCustomerName(order)} />
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
