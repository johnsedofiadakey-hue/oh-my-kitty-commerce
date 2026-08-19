import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getContentBlocks, toWhatsAppLink } from "@/lib/storefront/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach Oh My Kitty on WhatsApp for order support, product questions, and delivery updates.",
  alternates: { canonical: "/contact" }
};

export default async function ContactPage() {
  const content = await getContentBlocks();
  const whatsappNumber = content["whatsapp-number"];
  const whatsappLink = toWhatsAppLink(whatsappNumber);

  return (
    <main className="legal-page">
      <div className="legal-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/petals.svg" />
      </div>
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">Contact</span>
        <h1>Reach the store.</h1>
        <div className="legal-card">
          <section data-section-number="01">
            <h2>WhatsApp</h2>
            <p>
              <a href={whatsappLink} rel="noreferrer" target="_blank">
                {whatsappNumber}
              </a>{" "}
              for order support, product questions, pickup, and delivery updates.
            </p>
          </section>
          <section data-section-number="02">
            <h2>Location</h2>
            <p>{content["pickup-location"]}. Final map, directions, and opening hours can be added by admin.</p>
          </section>
          <section data-section-number="03">
            <h2>Social</h2>
            <p>
              <a href="https://www.instagram.com/ohmykitty_30/" rel="noreferrer" target="_blank">
                Instagram
              </a>
              , <a href="https://www.tiktok.com/@ohmykitty_30" rel="noreferrer" target="_blank">TikTok</a>,{" "}
              <a href="https://www.facebook.com/61572779391839/" rel="noreferrer" target="_blank">
                Facebook
              </a>
              , and{" "}
              <a href="https://www.snapchat.com/add/ohmykitty_30" rel="noreferrer" target="_blank">
                Snapchat
              </a>{" "}
              links are also available in the footer.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
