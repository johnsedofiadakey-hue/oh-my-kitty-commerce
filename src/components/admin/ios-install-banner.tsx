"use client";

import { useState } from "react";

const DISMISS_KEY = "omk-ios-install-banner-dismissed";

function isIos() {
  return typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * iOS has no equivalent of Chrome's install prompt — "Add to Home Screen"
 * only exists inside Safari's own Share sheet, so this is the one place we
 * can tell someone it exists at all. It matters here specifically because
 * iOS only grants push notifications (real-time alerts) to an installed,
 * standalone home-screen app — never to an ordinary Safari tab.
 */
function shouldShowBanner() {
  if (!isIos() || isStandalone()) {
    return false;
  }

  try {
    return localStorage.getItem(DISMISS_KEY) !== "true";
  } catch {
    return true;
  }
}

export function IosInstallBanner() {
  const [show, setShow] = useState(shouldShowBanner);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // Worst case the banner just reappears next visit.
    }
  }

  if (!show) {
    return null;
  }

  return (
    <div className="admin-alert push-permission-banner" role="status">
      <span>
        Install this as an app to get real-time alerts on your phone: tap <strong>Share</strong> in Safari, then{" "}
        <strong>Add to Home Screen</strong> — then open it from there and turn on alerts.
      </span>
      <div className="push-permission-actions">
        <button className="admin-action ghost small" onClick={dismiss} type="button">
          Not now
        </button>
      </div>
    </div>
  );
}
