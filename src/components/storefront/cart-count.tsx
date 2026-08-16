"use client";

import { useEffect, useState } from "react";
import { onCartChanged, readCartLines } from "@/components/storefront/add-to-bag-button";

export function CartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function syncCount() {
      setCount(readCartLines().reduce((total, line) => total + line.quantity, 0));
    }

    syncCount();
    return onCartChanged(syncCount);
  }, []);

  return <>Bag {count}</>;
}
