import { adminData } from "@/lib/admin/sample-admin-data";

export default function AdminSettingsPage() {
  const settings = [
    ["Store name", "Oh My Kitty"],
    ["Currency", "GHS"],
    ["Firebase", "Pending project details"],
    ["Payment provider", "TBD"],
    ["Receipt footer", "Editable before launch"],
    ["Inventory policy", "Ledgered stock movement"]
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Settings</h1>
          <p className="app-subtitle">Store identity, operational defaults, payment placeholders, and receipts.</p>
        </div>
        <button className="admin-action" type="button">
          Save changes
        </button>
      </div>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Store settings</h2>
          <span>No secrets stored here</span>
        </div>
        <div className="admin-table two">
          {settings.map(([label, value]) => (
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
          <span>{adminData.posShifts.length} shift</span>
        </div>
        <div className="stack-list">
          {adminData.posShifts.map((shift) => (
            <div className="stack-row" key={shift.id}>
              <strong>{shift.staffId}</strong>
              <span>
                {shift.status} / opening cash {shift.openingCash}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
