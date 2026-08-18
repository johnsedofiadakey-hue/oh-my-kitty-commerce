import Image from "next/image";
import Link from "next/link";
import { FaqAccordion } from "@/components/storefront/faq-accordion";

const FAQS = [
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
    answer: "Yes. Use WhatsApp 0241448231 or the social icons in the footer for customer support."
  },
  {
    question: "Where are product instructions?",
    answer: "Follow the product packaging. Admin can add usage, ingredient, and warning details per product before launch."
  },
  {
    question: "How do I pay?",
    answer: "Checkout supports card payment via Paystack, mobile money, and bank/manual transfer."
  }
];

export default function FaqPage() {
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
          <FaqAccordion entries={FAQS} />
        </div>
      </section>
    </main>
  );
}
