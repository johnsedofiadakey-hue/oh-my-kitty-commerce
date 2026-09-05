"use client";

import { useEffect } from "react";

/**
 * Same auto-print-on-load behavior as the receipt's print button, made
 * reusable for any print-formatted page (financial statements, reports).
 */
export function PrintPageButton({ label = "Print" }: { label?: string }) {
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
    <div className="statement-print-bar no-print">
      <button className="admin-action" onClick={() => window.print()} type="button">
        {label}
      </button>
      <button className="admin-action ghost" onClick={() => window.close()} type="button">
        Close
      </button>
    </div>
  );
}
