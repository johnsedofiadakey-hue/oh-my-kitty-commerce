"use client";

import { useEffect } from "react";

export function PrintReceiptButton() {
  // Auto-trigger the print dialog as soon as the receipt (including the
  // logo image) has finished loading — cuts the manual "click Print" step
  // out of the checkout flow. Waits for the window "load" event rather than
  // firing on mount, since the receipt logo is a plain <img> and printing
  // before it loads can leave it blank on the printout.
  useEffect(() => {
    const triggerPrint = () => window.print();

    if (document.readyState === "complete") {
      triggerPrint();
      return;
    }

    window.addEventListener("load", triggerPrint, { once: true });
    return () => window.removeEventListener("load", triggerPrint);
  }, []);

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
