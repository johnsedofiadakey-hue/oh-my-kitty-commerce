"use client";

import { useEffect } from "react";
import { saveOrderToHistory } from "@/lib/storefront/order-history";

type SaveOrderToHistoryOnMountProps = {
  orderNumber: string;
  total: number;
};

/** Runs client-side on the order-confirmation page so this device remembers
 *  the order number for the guest order history at /orders, without the
 *  server ever knowing which browser placed which order. */
export function SaveOrderToHistoryOnMount({ orderNumber, total }: SaveOrderToHistoryOnMountProps) {
  useEffect(() => {
    saveOrderToHistory({ orderNumber, total, createdAt: new Date().toISOString() });
  }, [orderNumber, total]);

  return null;
}
