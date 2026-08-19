import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Oh My Kitty collects, uses, and protects your information.",
  alternates: { canonical: "/privacy" }
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="legal-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/leaf-midground-01.svg" />
      </div>
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">Privacy</span>
        <h1>Privacy policy.</h1>
        <div className="legal-card">
          <section data-section-number="01">
            <h2>Customer information</h2>
            <p>
              Oh My Kitty will use customer information to process orders, provide delivery,
              support customer service, prevent fraud, and improve the shopping experience.
            </p>
          </section>
          <section data-section-number="02">
            <h2>Payments</h2>
            <p>
              Payment details are handled directly by Paystack. Sensitive payment credentials and
              card details are never stored in this application.
            </p>
          </section>
          <section data-section-number="03">
            <h2>Final legal review</h2>
            <p>
              This is starter website copy. Before public launch, replace it with final legal text
              reviewed for the business location, delivery policy, payment provider, and data rules.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
