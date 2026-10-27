/**
 * One Ghanaian phone number, written three ways, is still one number:
 *
 *   0241448231   +233241448231   024 144 8231
 *
 * Nothing in the app used to agree on that. `resolveCustomerId` compared raw
 * trimmed strings, so the same person ordering by phone and later by WhatsApp
 * quietly became two customers; `searchOrders` matched on the stored substring,
 * so looking up a number in the format the customer wrote it found nothing.
 *
 * Everything that compares or searches a phone number goes through here.
 * Arkesel's sender wants the same shape, so it uses this too.
 */

/** 233 plus the subscriber digits — no plus sign, no spaces. The form to store and compare. */
export function normalizeGhanaPhone(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  // 0241448231 -> 233241448231
  if (digits.startsWith("0")) {
    return `233${digits.slice(1)}`;
  }

  // Already 233..., or a bare 241448231 typed without the leading zero.
  if (digits.startsWith("233")) {
    return digits;
  }

  // Ghanaian subscriber numbers are 9 digits after the network code's leading
  // zero. Anything else is left alone rather than guessed at — a foreign
  // number should not be rewritten into a Ghanaian one.
  return digits.length === 9 ? `233${digits}` : digits;
}

/** True when two numbers are the same line, however each was typed. */
export function isSameGhanaPhone(first: string | null | undefined, second: string | null | undefined): boolean {
  const left = normalizeGhanaPhone(first);
  const right = normalizeGhanaPhone(second);
  return left !== "" && left === right;
}
