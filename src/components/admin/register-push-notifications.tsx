"use client";

import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getClientMessaging } from "@/lib/firebase/client";
import { publicEnv } from "@/lib/env/public";
import type { PushSubscriptionPlatform } from "@/lib/commerce/types";

const DISMISS_KEY = "omk-push-banner-dismissed";

type RegisterAction = (input: {
  token: string;
  platform: PushSubscriptionPlatform;
  userAgent: string;
}) => Promise<{ ok: boolean }>;

function detectPlatform(): PushSubscriptionPlatform {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) {
    return "android-chrome";
  }
  if (/Windows/i.test(ua)) {
    return "windows-chrome";
  }
  return "other";
}

function isPushCapable() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window;
}

/** Lazy useState initializer, not a setState-in-effect — runs once on the client's first render, same fix pattern used for pos-sale-client.tsx's isOnline state earlier this session. */
function shouldShowBanner() {
  if (!isPushCapable() || Notification.permission !== "default") {
    return false;
  }

  try {
    return localStorage.getItem(DISMISS_KEY) !== "true";
  } catch {
    return true;
  }
}

async function registerDevice(registerAction: RegisterAction) {
  const messaging = getClientMessaging();
  const vapidKey = publicEnv.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!messaging || !vapidKey) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
    const token = await getToken(messaging, { serviceWorkerRegistration: registration, vapidKey });
    if (!token) {
      return;
    }

    await registerAction({ token, platform: detectPlatform(), userAgent: navigator.userAgent });
  } catch {
    // Fail silently — same contract as RegisterPosServiceWorker. Without a
    // granted push subscription, staff just don't get order alerts on this
    // device; everything else keeps working.
  }
}

/**
 * Mounted app-wide (admin + POS layouts), not just on the POS screen — a
 * staff member browsing Products or Orders should still get alerted to a
 * new online order, not only while the POS screen happens to be open.
 */
export function RegisterPushNotifications({ registerAction }: { registerAction: RegisterAction }) {
  const [showBanner, setShowBanner] = useState(shouldShowBanner);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (isPushCapable() && Notification.permission === "granted") {
      void registerDevice(registerAction);
    }
    // registerAction is a stable server-action reference from the layout — intentionally excluded to avoid re-running on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const messaging = getClientMessaging();
    if (!messaging) {
      return;
    }

    // A push arriving while the tab is focused doesn't hit the service
    // worker's background handler — this is the foreground equivalent.
    return onMessage(messaging, (payload) => {
      setToast(payload.notification?.title ?? "New order");
    });
  }, []);

  async function handleEnable() {
    setShowBanner(false);
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await registerDevice(registerAction);
    }
  }

  function handleDismiss() {
    setShowBanner(false);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // Nothing to do — worst case the banner reappears next visit.
    }
  }

  return (
    <>
      {showBanner ? (
        <div className="admin-alert push-permission-banner" role="status">
          <span>Enable order alerts on this device?</span>
          <div className="push-permission-actions">
            <button className="admin-action small" onClick={handleEnable} type="button">
              Enable
            </button>
            <button className="admin-action ghost small" onClick={handleDismiss} type="button">
              Not now
            </button>
          </div>
        </div>
      ) : null}
      {toast ? (
        <div className="push-toast" onAnimationEnd={() => setToast(null)} role="status">
          {toast}
        </div>
      ) : null}
    </>
  );
}
