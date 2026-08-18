"use client";

import { useEffect } from "react";

/**
 * Registered manually with scope "/pos" rather than via Serwist's automatic
 * site-wide registration — the browser then physically cannot route fetches
 * from /admin or the storefront through this service worker, whatever it
 * does. Failing silently is intentional: without a service worker, POS just
 * falls back to online-only, which is exactly today's behavior.
 */
export function RegisterPosServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js", { scope: "/pos/" }).catch(() => undefined);
  }, []);

  return null;
}
