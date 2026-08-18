import Image from "next/image";
import Link from "next/link";

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
              The final return, exchange, cancellation, and intimate-care product policies must be
              confirmed by the business before launch.
            </p>
          </section>
          <section data-section-number="04">
            <h2>Final legal review</h2>
            <p>
              This is starter website copy. Replace it with final legal wording before accepting
              real customer orders.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
