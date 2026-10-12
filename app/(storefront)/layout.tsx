import { CartDrawer } from "@/components/storefront/cart-drawer";
import { FooterGate } from "@/components/storefront/footer-gate";
import { getContentValue } from "@/lib/storefront/content";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/structured-data";

export default async function StorefrontLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [whatsappNumber, pickupLocation, mapLink] = await Promise.all([
    getContentValue("whatsapp-number"),
    getContentValue("pickup-location"),
    getContentValue("pickup-map-link")
  ]);

  return (
    <div className="storefront-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildOrganizationJsonLd(whatsappNumber, { pickupLocation, mapLink }))
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSiteJsonLd()) }}
      />
      {children}
      <FooterGate whatsappNumber={whatsappNumber} />
      <CartDrawer />
    </div>
  );
}
