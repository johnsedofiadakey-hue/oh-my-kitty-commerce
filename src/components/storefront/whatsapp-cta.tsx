"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// TikTok, Instagram, and Facebook open links in their own locked-down in-app
// WebView rather than the device's real browser. That WebView deliberately
// blocks the OS-level app handoff wa.me links rely on to open WhatsApp, so
// tapping the link there does nothing — the customer sees no error, just a
// dead button. There's no way to force WhatsApp open from inside it; the
// only real fix is detecting it and pointing the customer at the browser's
// own "Open in Browser" escape hatch instead.
const IN_APP_BROWSER_PATTERN = /musical_ly|bytedancewebview|tiktok|instagram|FBAN|FBAV|FB_IAB|FBSV/i;

function subscribeNever() {
  return () => {};
}

// The user agent can't change mid-session, so this is read as a stable
// snapshot rather than set from an effect — same reasoning as the
// localStorage reads elsewhere in the storefront (see cart-store.ts).
function getInAppBrowserSnapshot() {
  return IN_APP_BROWSER_PATTERN.test(navigator.userAgent);
}

function getInAppBrowserServerSnapshot() {
  return false;
}

export function WhatsAppCta({
  className,
  href,
  label,
  phoneDisplay
}: {
  className?: string;
  href: string;
  label: string;
  phoneDisplay: string;
}) {
  const restricted = useSyncExternalStore(subscribeNever, getInAppBrowserSnapshot, getInAppBrowserServerSnapshot);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(phoneDisplay);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable in this browser — the number is still
      // visible right there to copy by hand.
    }
  }

  if (!restricted) {
    return (
      <a className={className} href={href} rel="noreferrer" target="_blank">
        {label}
      </a>
    );
  }

  return (
    <div className="whatsapp-fallback" ref={containerRef}>
      <button className={className} onClick={() => setOpen((value) => !value)} type="button">
        {label}
      </button>
      {open ? (
        <div className="whatsapp-fallback-popover" role="dialog">
          <p>This app&apos;s browser blocks WhatsApp from opening directly.</p>
          <p>
            Tap <strong>⋯</strong> at the top and choose <strong>Open in Browser</strong>, then try again — or
            message us at:
          </p>
          <div className="whatsapp-fallback-number">
            <strong>{phoneDisplay}</strong>
            <button onClick={() => void handleCopy()} type="button">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
