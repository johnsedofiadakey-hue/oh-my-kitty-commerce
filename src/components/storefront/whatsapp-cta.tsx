"use client";

import { useSyncExternalStore } from "react";
import { toAndroidWhatsAppEscapeLink, toWhatsAppLink } from "@/lib/storefront/whatsapp";

// TikTok, Instagram, and Facebook open links in their own locked-down in-app
// WebView rather than the device's real browser. That WebView deliberately
// blocks the OS-level app handoff wa.me links rely on to open WhatsApp, so
// a plain tap there does nothing. On Android we can still get there in one
// direct tap: an Intent URI targeting WhatsApp's own package is resolved by
// the OS itself, not the WebView's JS sandbox, so it launches the app with
// no browser hop in between. iOS has no equivalent — Apple's WKWebView
// doesn't give a web page that escape, so the best a tap can do there is a
// plain top-level navigation instead of one that opens a (blocked) new tab.
const IN_APP_BROWSER_PATTERN = /musical_ly|bytedancewebview|tiktok|instagram|FBAN|FBAV|FB_IAB|FBSV/i;
const ANDROID_PATTERN = /Android/i;

function subscribeNever() {
  return () => {};
}

// User agent can't change mid-session, so these are read as stable
// snapshots rather than set from an effect (avoids react-hooks/set-state-in-effect;
// same reasoning as the localStorage reads elsewhere in the storefront).
function getRestrictedSnapshot() {
  return IN_APP_BROWSER_PATTERN.test(navigator.userAgent);
}

function getRestrictedServerSnapshot() {
  return false;
}

function getAndroidSnapshot() {
  return ANDROID_PATTERN.test(navigator.userAgent);
}

function getAndroidServerSnapshot() {
  return false;
}

export function WhatsAppCta({
  className,
  phoneNumber,
  message,
  label
}: {
  className?: string;
  phoneNumber: string;
  message?: string;
  label: string;
}) {
  const restricted = useSyncExternalStore(subscribeNever, getRestrictedSnapshot, getRestrictedServerSnapshot);
  const isAndroid = useSyncExternalStore(subscribeNever, getAndroidSnapshot, getAndroidServerSnapshot);

  if (restricted && isAndroid) {
    return (
      <a className={className} href={toAndroidWhatsAppEscapeLink(phoneNumber, message)}>
        {label}
      </a>
    );
  }

  const href = toWhatsAppLink(phoneNumber, message);

  if (!restricted) {
    return (
      <a className={className} href={href} rel="noreferrer" target="_blank">
        {label}
      </a>
    );
  }

  return (
    <a className={className} href={href} rel="noreferrer">
      {label}
    </a>
  );
}
