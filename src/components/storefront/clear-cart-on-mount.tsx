"use client";

import { useEffect } from "react";
import { clearCartLines } from "@/components/storefront/add-to-bag-button";

/** Paystack confirmation runs server-side, so nothing else clears the client's cart on success. */
export function ClearCartOnMount() {
  useEffect(() => {
    clearCartLines();
  }, []);

  return null;
}
