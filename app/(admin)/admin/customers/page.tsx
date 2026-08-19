import { formatMoney, getAdminOperationsData } from "@/lib/admin/operations-data";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { CreateCustomerForm } from "@/components/admin/customer-form";
import { requireAdminPermission } from "@/lib/auth/server";
import { createCustomerAction, updateCustomerAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requireAdminPermission("customers.view");
  const data = await getAdminOperationsData();
  const disabled = data.source !== "live";

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Customers</h1>
          <p className="app-subtitle">Customer profiles, order history, and POS walk-in records.</p>
        </div>
        <AdminDrawer title="New customer" triggerLabel="New customer">
          <CreateCustomerForm action={createCustomerAction} disabled={disabled} />
        </AdminDrawer>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Customers</h2>
          <span>{data.customers.length} customers</span>
        </div>
        <div className="quick-edit-list">
          {data.customers.map((customer) => {
            const orders = data.orders.filter((order) => order.customerId === customer.id);
            const total = orders.reduce((sum, order) => sum + order.total, 0);

            return (
              <form action={updateCustomerAction} className="quick-edit-row" key={customer.id}>
                <input name="id" type="hidden" value={customer.id} />
                <label className="admin-field">
                  <span>Name</span>
                  <input defaultValue={customer.name ?? ""} disabled={disabled} name="name" />
                </label>
                <label className="admin-field">
                  <span>Phone</span>
                  <input defaultValue={customer.phone ?? ""} disabled={disabled} name="phone" />
                </label>
                <label className="admin-field">
                  <span>Email</span>
                  <input defaultValue={customer.email ?? ""} disabled={disabled} name="email" type="email" />
                </label>
                <label className="admin-field">
                  <span>Source</span>
                  <input disabled value={customer.createdFrom} />
                </label>
                <label className="admin-field">
                  <span>Orders</span>
                  <input disabled value={`${orders.length} / ${formatMoney(total)}`} />
                </label>
                <button className="admin-action" disabled={disabled} type="submit">
                  Save
                </button>
              </form>
            );
          })}
          {data.customers.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
        </div>
      </section>
    </>
  );
}
