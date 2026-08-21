import { CartDrawer } from "@/components/storefront/cart-drawer";
import { FooterGate } from "@/components/storefront/footer-gate";
import { getContentValue } from "@/lib/storefront/content";
import { buildOrganizationJsonLd } from "@/lib/seo/structured-data";

export default async function StorefrontLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const whatsappNumber = await getContentValue("whatsapp-number");

  return (
    <div className="storefront-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd(whatsappNumber)) }}
      />
      {children}
      <FooterGate whatsappNumber={whatsappNumber} />
      <CartDrawer />
    </div>
  );
}
