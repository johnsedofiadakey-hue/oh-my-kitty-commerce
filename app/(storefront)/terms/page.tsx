import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you shop with Oh My Kitty.",
  alternates: { canonical: "/terms" }
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <div className="legal-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/leaf-foreground-01.svg" />
      </div>
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">Terms</span>
        <h1>Terms &amp; conditions.</h1>
        <div className="legal-card">
          <section data-section-number="01">
            <h2>Orders</h2>
            <p>
              Orders are confirmed after Paystack payment succeeds, or after manual confirmation
              for mobile money and bank transfer.
            </p>
          </section>
          <section data-section-number="02">
            <h2>Delivery and pickup</h2>
            <p>
              Delivery fees, pickup options, and estimated timelines are shown at checkout before
              the customer completes an order.
            </p>
          </section>
          <section data-section-number="03">
            <h2>Returns and support</h2>
            <p>
              See our <Link href={"/returns" as Route}>Returns &amp; Support</Link> page for how
              returns, exchanges, and refunds work.
            </p>
          </section>
          <section data-section-number="04">
            <h2>Questions</h2>
            <p>
              If anything here isn&apos;t clear, <Link href={"/contact" as Route}>contact us</Link> and
              we&apos;ll help.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
