"use client";

import { useEffect, useRef, useState } from "react";
import { onCartChanged, readCartLines } from "@/components/storefront/add-to-bag-button";

type CartCountProps = {
  variant?: "text" | "badge";
};

export function CartCount({ variant = "text" }: CartCountProps) {
  const [count, setCount] = useState(0);
  const [bump, setBump] = useState(false);
  const previousCount = useRef(0);

  useEffect(() => {
    function syncCount() {
      const next = readCartLines().reduce((total, line) => total + line.quantity, 0);
      if (next > previousCount.current) {
        setBump(true);
        window.setTimeout(() => setBump(false), 420);
      }
      previousCount.current = next;
      setCount(next);
    }

    syncCount();
    return onCartChanged(syncCount);
  }, []);

  if (variant === "badge") {
    if (count === 0) {
      return null;
    }

    return (
      <span aria-hidden="true" className={`bag-badge ${bump ? "bump" : ""}`}>
        {count}
      </span>
    );
  }

  return <>Cart {count}</>;
}
