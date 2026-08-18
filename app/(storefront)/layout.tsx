import { FooterGate } from "@/components/storefront/footer-gate";

export default function StorefrontLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="storefront-shell">
      {children}
      <FooterGate />
    </div>
  );
}
