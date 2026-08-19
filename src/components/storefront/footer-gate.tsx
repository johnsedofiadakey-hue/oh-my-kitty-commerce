"use client";

import { usePathname } from "next/navigation";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";

const TRANSACTIONAL_PREFIXES = ["/cart", "/checkout"];

export function FooterGate({ whatsappNumber }: { whatsappNumber: string }) {
  const pathname = usePathname();
  const isTransactional = TRANSACTIONAL_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <StorefrontFooter variant={isTransactional ? "minimal" : "full"} whatsappNumber={whatsappNumber} />
  );
}
