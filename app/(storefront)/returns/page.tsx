import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { FaqAccordion } from "@/components/storefront/faq-accordion";
import { getContentValue } from "@/lib/storefront/content";

export const metadata: Metadata = {
  title: "Returns & Support",
  description: "Our policy on returns, and how to reach us if something is wrong with your order at Oh My Kitty.",
  alternates: { canonical: "/returns" }
};

function buildReturnSteps(whatsappNumber: string) {
  return [
    {
      title: "Reach out within 48 hours",
      description: `Message WhatsApp ${whatsappNumber} with your order number and a short note.`
    },
    {
      title: "We look into it",
      description: "If your order arrived damaged or isn't what you ordered, send us a photo and we'll review it."
    },
    {
      title: "We confirm next steps",
      description: "We let you know what we can do, directly with you over WhatsApp."
    }
  ];
}

const RETURN_FAQS = [
  {
    question: "Can I return an opened intimate-care product?",
    answer:
      "For hygiene reasons, opened intimate-care products cannot be returned."
  },
  {
    question: "Do you offer refunds?",
    answer: "No. All sales are final once an order is placed, so please check your order carefully before you pay."
  },
  {
    question: "What if my order arrived damaged?",
    answer: "Message WhatsApp with a photo of the item and packaging as soon as it arrives so we can make it right."
  }
];

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const whatsappNumber = await getContentValue("whatsapp-number");

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
            <h2>If something is wrong with your order</h2>
            <div className="step-row">
              {buildReturnSteps(whatsappNumber).map((step, index) => (
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
