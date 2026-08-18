"use client";

import { useEffect, useState } from "react";
import { onCartChanged, readCartLines } from "@/components/storefront/add-to-bag-button";

type CartCountProps = {
  variant?: "text" | "badge";
};

export function CartCount({ variant = "text" }: CartCountProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function syncCount() {
      setCount(readCartLines().reduce((total, line) => total + line.quantity, 0));
    }

    syncCount();
    return onCartChanged(syncCount);
  }, []);

  if (variant === "badge") {
    if (count === 0) {
      return null;
    }

    return (
      <span aria-hidden="true" className="bag-badge">
        {count}
      </span>
    );
  }

  return <>Bag {count}</>;
}
