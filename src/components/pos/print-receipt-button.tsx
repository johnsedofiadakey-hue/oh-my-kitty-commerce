"use client";

export function PrintReceiptButton() {
  return (
    <div className="receipt-print-bar no-print">
      <button className="admin-action" onClick={() => window.print()} type="button">
        Print receipt
      </button>
      <button className="admin-action ghost" onClick={() => window.close()} type="button">
        Close
      </button>
    </div>
  );
}
