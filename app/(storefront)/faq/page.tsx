import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { FaqAccordion } from "@/components/storefront/faq-accordion";
import { getContentValue } from "@/lib/storefront/content";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about ordering, pickup, delivery, and payment at Oh My Kitty.",
  alternates: { canonical: "/faq" }
};

function buildFaqs(whatsappNumber: string) {
  return [
    {
      question: "Can I order online and pick up?",
      answer: "Yes. Pickup is available in the checkout flow and can be confirmed by the store before fulfilment."
    },
    {
      question: "Are prices final?",
      answer:
        "The current catalogue is editable by admin. Final product prices, bundles, and promotions should be confirmed before public launch."
    },
    {
      question: "Can I contact the store before buying?",
      answer: `Yes. Use WhatsApp ${whatsappNumber} or the social icons in the footer for customer support.`
    },
    {
      question: "Where are product instructions?",
      answer: "Follow the product packaging. Admin can add usage, ingredient, and warning details per product before launch."
    },
    {
      question: "How do I pay?",
      answer: "Checkout is handled securely by Paystack, which accepts both card and mobile money."
    }
  ];
}

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const whatsappNumber = await getContentValue("whatsapp-number");

  return (
    <main className="legal-page">
      <div className="legal-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/leaf-foreground-01.svg" />
      </div>
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">FAQ</span>
        <h1>Questions, answered softly.</h1>
        <div className="legal-card">
          <FaqAccordion entries={buildFaqs(whatsappNumber)} />
        </div>
      </section>
    </main>
  );
}
