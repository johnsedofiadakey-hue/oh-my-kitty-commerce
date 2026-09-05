import { toInternationalNumber } from "@/lib/storefront/whatsapp";

/**
 * A downloadable contact card — tapping it on a phone opens the native "Add
 * to Contacts" screen with the number pre-filled, instead of asking someone
 * to copy a number and type it in by hand. That's the actual mechanism
 * behind "save our WhatsApp number": a plain wa.me link gets you a
 * conversation, not a saved contact.
 */
export function buildContactCardDataUrl(name: string, localNumber: string) {
  const international = `+${toInternationalNumber(localNumber)}`;
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    `ORG:${name}`,
    `TEL;TYPE=CELL:${international}`,
    "END:VCARD"
  ].join("\r\n");

  return `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`;
}
