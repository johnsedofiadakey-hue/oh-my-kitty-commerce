import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { FaqAccordion } from "@/components/storefront/faq-accordion";
import { getContentValue } from "@/lib/storefront/content";
import { buildFaqJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about ordering, pickup, delivery, and payment at Oh My Kitty.",
  alternates: { canonical: "/faq" }
};

function buildFaqs(whatsappNumber: string) {
  return [
    {
      question: "Can I order online and pick up?",
      answer: "Yes. Choose pickup when you check out, and we'll get your order ready for you."
    },
    {
      question: "Do you offer discounts?",
      answer: "Yes — if you have a promo code, enter it at checkout to get your discount."
    },
    {
      question: "Can I contact the store before buying?",
      answer: `Yes. Message us on WhatsApp ${whatsappNumber}, or use the social links in the footer.`
    },
    {
      question: "How do I use the products?",
      answer: "Instructions are on the product packaging. If you're not sure, message us on WhatsApp and we'll help."
    },
    {
      question: "How do I pay?",
      answer: "You can pay by Mobile Money or card. Payments are handled securely by Paystack."
    }
  ];
}

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const whatsappNumber = await getContentValue("whatsapp-number");
  const faqs = buildFaqs(whatsappNumber);

  return (
    <main className="legal-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd(faqs)) }}
      />
      <div className="legal-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/leaf-foreground-01.svg" />
      </div>
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">FAQ</span>
        <h1>Common questions.</h1>
        <div className="legal-card">
          <FaqAccordion entries={faqs} />
        </div>
      </section>
    </main>
  );
}
