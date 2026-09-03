import { formatMoney, getAdminOperationsData } from "@/lib/admin/operations-data";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { isPaystackConfigured } from "@/lib/payments/paystack";
import { requireAdminPermission } from "@/lib/auth/server";
import { updateStoreSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminPermission("settings.view");
  const context = getCommerceServerContext();
  const firebaseConfigured = Boolean(context);
  const paystackConfigured = isPaystackConfigured();
  const storeSettings = context ? await context.repo.getStoreSettings().catch(() => null) : null;
  const data = await getAdminOperationsData();
  const statusRows = [
    ["Currency", "GHS"],
    ["Firebase", firebaseConfigured ? "Connected" : "Pending project details"],
    [
      "Payment provider",
      paystackConfigured ? "Paystack (live keys set)" : "Paystack (awaiting API keys)"
    ],
    ["Inventory policy", "Ledgered stock movement"]
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Settings</h1>
          <p className="app-subtitle">Store identity, operational defaults, payment placeholders, and receipts.</p>
        </div>
      </div>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Store settings</h2>
          <span>No secrets stored here</span>
        </div>
        <form action={updateStoreSettingsAction} className="admin-form">
          <fieldset disabled={!firebaseConfigured}>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Store name</span>
                <input
                  defaultValue={storeSettings?.storeName ?? "Oh My Kitty"}
                  name="storeName"
                  required
                />
              </label>
              <label className="admin-field">
                <span>Receipt footer</span>
                <input
                  defaultValue={storeSettings?.receiptFooter ?? ""}
                  name="receiptFooter"
                  placeholder="Thank you for shopping with us"
                />
              </label>
            </div>
            <button className="admin-action" type="submit">
              Save changes
            </button>
          </fieldset>
          {!firebaseConfigured ? (
            <p className="admin-help">Enable Firestore and sign in to save settings.</p>
          ) : null}
        </form>
        <div className="admin-table two">
          {statusRows.map(([label, value]) => (
            <div className="admin-table-row" key={label}>
              <strong>{label}</strong>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>POS shifts</h2>
          <span>{data.posShifts.length} shift{data.posShifts.length === 1 ? "" : "s"}</span>
        </div>
        <div className="stack-list">
          {data.posShifts.map((shift) => (
            <div className="stack-row" key={shift.id}>
              <strong>{shift.staffId}</strong>
              <span>
                {shift.status} / opening cash {formatMoney(shift.openingCash)}
              </span>
            </div>
          ))}
          {data.posShifts.length === 0 ? <p className="admin-help">No shifts yet.</p> : null}
        </div>
      </section>
    </>
  );
}
