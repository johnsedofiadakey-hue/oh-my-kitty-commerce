"use client";

import { useEffect, useRef, useState } from "react";
import { onCartChanged, readCartLines } from "@/components/storefront/add-to-bag-button";

/** True for a brief window right after the cart's total quantity increases. */
export function useCartBump(durationMs = 420) {
  const [bump, setBump] = useState(false);
  const previousCount = useRef(0);

  useEffect(() => {
    function syncCount() {
      const next = readCartLines().reduce((total, line) => total + line.quantity, 0);
      if (next > previousCount.current) {
        setBump(true);
        window.setTimeout(() => setBump(false), durationMs);
      }
      previousCount.current = next;
    }

    syncCount();
    return onCartChanged(syncCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- durationMs is a constant-in-practice config value, not reactive state.
  }, []);

  return bump;
}
