import { formatMoney, getAdminOperationsData } from "@/lib/admin/operations-data";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { CreateCustomerForm } from "@/components/admin/customer-form";
import { CustomerRow } from "@/components/admin/customer-row";
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
              <CustomerRow
                createdFrom={customer.createdFrom}
                disabled={disabled}
                email={customer.email}
                id={customer.id}
                key={customer.id}
                name={customer.name}
                orderCount={orders.length}
                orderTotalLabel={formatMoney(total)}
                phone={customer.phone}
                updateCustomerAction={updateCustomerAction}
              />
            );
          })}
          {data.customers.length === 0 ? <p className="admin-help">Nothing here yet.</p> : null}
        </div>
      </section>
    </>
  );
}
