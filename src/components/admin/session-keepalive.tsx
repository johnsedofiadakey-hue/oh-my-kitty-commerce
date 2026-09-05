"use client";

import { useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";

const LAST_REFRESH_KEY = "omk-admin-session-refreshed-at";
// The session cookie itself lasts 14 days (Firebase's own ceiling) —
// refreshing once a day is plenty of margin without hitting the session
// endpoint on every single page load.
const REFRESH_INTERVAL_MS = 1000 * 60 * 60 * 24;

function shouldRefresh() {
  try {
    const lastRefresh = Number(localStorage.getItem(LAST_REFRESH_KEY) ?? 0);
    return Date.now() - lastRefresh >= REFRESH_INTERVAL_MS;
  } catch {
    return true;
  }
}

async function refreshSession(idToken: string) {
  try {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });

    if (response.ok) {
      localStorage.setItem(LAST_REFRESH_KEY, String(Date.now()));
    }
  } catch {
    // Best-effort — worst case the session just expires on its normal
    // 14-day schedule and she signs in again, same as before this existed.
  }
}

/**
 * Keeps the admin session cookie from expiring while she's still an
 * actively signed-in user on this device. Without this, even a daily-use
 * installed PWA would eventually hit the cookie's 14-day ceiling and force
 * a fresh sign-in. Silently mints a new cookie from the client SDK's own
 * long-lived login — which Firebase keeps signed in on-device until she
 * actually signs out — once a day at most, so simply opening the app
 * periodically is enough to stay signed in indefinitely.
 */
export function SessionKeepAlive() {
  useEffect(() => {
    const auth = getClientAuth();
    if (!auth) {
      return;
    }

    function maybeRefresh(user: User | null) {
      if (user && shouldRefresh()) {
        void user.getIdToken().then(refreshSession);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, maybeRefresh);

    function handleVisibility() {
      if (document.visibilityState === "visible" && auth) {
        maybeRefresh(auth.currentUser);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
}
