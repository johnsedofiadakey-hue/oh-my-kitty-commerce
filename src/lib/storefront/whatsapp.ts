/** `0241448231` -> `233241448231`, the format wa.me links require. */
export function toWhatsAppLink(localNumber: string, message?: string) {
  const digits = localNumber.replace(/\D/g, "");
  const withCountryCode = digits.startsWith("0") ? `233${digits.slice(1)}` : digits;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${withCountryCode}${query}`;
}

/**
 * Escapes an Android in-app browser (TikTok, Instagram, Facebook) that
 * blocks a plain https link from handing off to an installed app. An
 * Android Intent URI is resolved by the OS itself rather than the WebView's
 * JS sandbox, so it can force the request out to the device's actual
 * browser — which then completes the normal wa.me -> WhatsApp handoff.
 *
 * No iOS equivalent exists: Apple's WKWebView doesn't expose this escape to
 * a web page, so a restricted iOS in-app browser can only be worked around
 * by the customer using that app's own "open in browser" control.
 */
export function toAndroidBrowserEscapeLink(httpsUrl: string) {
  const withoutScheme = httpsUrl.replace(/^https:\/\//, "");
  const fallback = encodeURIComponent(httpsUrl);
  return `intent://${withoutScheme}#Intent;scheme=https;action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end;`;
}
