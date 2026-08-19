/** `0241448231` -> `233241448231`, the format wa.me links require. */
export function toWhatsAppLink(localNumber: string) {
  const digits = localNumber.replace(/\D/g, "");
  const withCountryCode = digits.startsWith("0") ? `233${digits.slice(1)}` : digits;
  return `https://wa.me/${withCountryCode}`;
}
