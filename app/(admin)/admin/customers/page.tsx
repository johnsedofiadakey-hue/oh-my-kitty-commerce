import { formatMoney, getAdminOperationsData } from "@/lib/admin/operations-data";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const data = await getAdminOperationsData();

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Customers</h1>
          <p className="app-subtitle">Customer profiles, order history, and POS walk-in records.</p>
        </div>
        <button className="admin-action" type="button">
          New customer
        </button>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Customer list</h2>
          <span>{data.customers.length} customers</span>
        </div>
        <div className="admin-table">
          <div className="admin-table-row header">
            <span>Name</span>
            <span>Phone</span>
            <span>Email</span>
            <span>Source</span>
            <span>Orders</span>
          </div>
          {data.customers.map((customer) => {
            const orders = data.orders.filter((order) => order.customerId === customer.id);
            const total = orders.reduce((sum, order) => sum + order.total, 0);

            return (
              <div className="admin-table-row" key={customer.id}>
                <strong>{customer.name ?? "Unnamed customer"}</strong>
                <span>{customer.phone ?? "Not set"}</span>
                <span>{customer.email ?? "Not set"}</span>
                <span>{customer.createdFrom}</span>
                <span>
                  {orders.length} / {formatMoney(total)}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
