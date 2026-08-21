import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getContentValue, toWhatsAppLink } from "@/lib/storefront/content";

export const metadata: Metadata = {
  title: "We'll be right back",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function ShopClosedPage() {
  const [message, whatsappNumber] = await Promise.all([
    getContentValue("shop-closed-message"),
    getContentValue("whatsapp-number")
  ]);

  return (
    <main className="legal-page">
      <div className="legal-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/leaf-midground-01.svg" />
      </div>
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">Closed</span>
        <h1>We&apos;ll be right back.</h1>
        <div className="legal-card">
          <section>
            <p>{message}</p>
          </section>
        </div>
        <a className="portal-cta" href={toWhatsAppLink(whatsappNumber)} rel="noreferrer" target="_blank">
          <span>Message us on WhatsApp</span>
          <i aria-hidden="true" />
        </a>
        <Link className="text-button" href="/track">
          Track an existing order
        </Link>
      </section>
    </main>
  );
}
