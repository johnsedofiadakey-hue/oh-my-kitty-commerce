import {
  formatMoney,
  getOrderCustomerName,
  getOrderRows
} from "@/lib/admin/sample-admin-data";

export default function AdminOrdersPage() {
  const rows = getOrderRows();

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Orders</h1>
          <p className="app-subtitle">Online, POS, and admin-created sales with separate status tracking.</p>
        </div>
        <button className="admin-action" type="button">
          Create order
        </button>
      </div>
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
    </>
  );
}
