/** `0241448231` -> `233241448231`, the format wa.me/whatsapp:// links require. */
function toInternationalNumber(localNumber: string) {
  const digits = localNumber.replace(/\D/g, "");
  return digits.startsWith("0") ? `233${digits.slice(1)}` : digits;
}

/** `0241448231` -> `233241448231`, the format wa.me links require. */
export function toWhatsAppLink(localNumber: string, message?: string) {
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${toInternationalNumber(localNumber)}${query}`;
}

/**
 * Opens WhatsApp directly on Android — for use only inside a restricted
 * in-app browser (TikTok, Instagram, Facebook) where a plain wa.me tap does
 * nothing. An Android Intent URI targeting WhatsApp's own package is
 * resolved by the OS itself rather than the WebView's JS sandbox, so it
 * launches the app in one tap with no browser hop in between — shorter and
 * more direct than routing through the device's browser first, which is all
 * a generic (non-WhatsApp-specific) escape link can do. Falls back to the
 * plain wa.me web link if WhatsApp isn't installed.
 *
 * No iOS equivalent exists: Apple's WKWebView doesn't let a restricted
 * in-app browser hand off to a custom URL scheme at all, whether that's
 * `whatsapp://` directly or an intent wrapping it.
 */
export function toAndroidWhatsAppEscapeLink(localNumber: string, message?: string) {
  const query = message ? `&text=${encodeURIComponent(message)}` : "";
  const fallback = encodeURIComponent(toWhatsAppLink(localNumber, message));
  return `intent://send?phone=${toInternationalNumber(localNumber)}${query}#Intent;scheme=whatsapp;package=com.whatsapp;S.browser_fallback_url=${fallback};end;`;
}
