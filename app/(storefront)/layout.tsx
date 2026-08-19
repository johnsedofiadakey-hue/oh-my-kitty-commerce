import { CartDrawer } from "@/components/storefront/cart-drawer";
import { FooterGate } from "@/components/storefront/footer-gate";
import { getContentValue } from "@/lib/storefront/content";

export default async function StorefrontLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const whatsappNumber = await getContentValue("whatsapp-number");

  return (
    <div className="storefront-shell">
      {children}
      <FooterGate whatsappNumber={whatsappNumber} />
      <CartDrawer />
    </div>
  );
}
