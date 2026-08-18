import Image from "next/image";
import Link from "next/link";
import { FaqAccordion } from "@/components/storefront/faq-accordion";

const RETURN_STEPS = [
  {
    title: "Reach out within 48 hours",
    description: "Message WhatsApp 0241448231 with your order number and a short note."
  },
  {
    title: "We review your case",
    description: "Unopened, hygiene-sealed items are reviewed for exchange or refund."
  },
  {
    title: "Exchange or refund confirmed",
    description: "We confirm next steps and timing directly with you over WhatsApp."
  }
];

const RETURN_FAQS = [
  {
    question: "Can I return an opened intimate-care product?",
    answer:
      "For hygiene reasons, opened intimate-care products generally cannot be returned. Contact WhatsApp to discuss your specific case."
  },
  {
    question: "How long do refunds take?",
    answer: "Once approved, refunds are processed back to your original payment method within a few business days."
  },
  {
    question: "What if my order arrived damaged?",
    answer: "Message WhatsApp with a photo of the item and packaging as soon as it arrives so we can make it right."
  }
];

export default function ReturnsPage() {
  return (
    <main className="legal-page">
      <div className="legal-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/leaf-midground-01.svg" />
      </div>
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">Returns</span>
        <h1>Returns and support.</h1>
        <div className="legal-card">
          <section data-section-number="01">
            <h2>How returns work</h2>
            <div className="step-row">
              {RETURN_STEPS.map((step, index) => (
                <div className="step-card" key={step.title}>
                  <strong className="step-number">{index + 1}</strong>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section data-section-number="02">
            <h2>Common questions</h2>
            <FaqAccordion entries={RETURN_FAQS} />
          </section>
        </div>
      </section>
    </main>
  );
}
