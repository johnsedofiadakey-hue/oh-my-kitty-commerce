import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="legal-page">
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">Terms</span>
        <h1>Terms & conditions.</h1>
        <div className="legal-card">
          <section>
            <h2>Orders</h2>
            <p>
              Orders are confirmed after payment or approved manual confirmation, depending on the
              payment method enabled for the store.
            </p>
          </section>
          <section>
            <h2>Delivery and pickup</h2>
            <p>
              Delivery fees, pickup options, timelines, and fulfilment updates should be shown at
              checkout before the customer completes an order.
            </p>
          </section>
          <section>
            <h2>Returns and support</h2>
            <p>
              The final return, exchange, cancellation, and intimate-care product policies must be
              confirmed by the business before launch.
            </p>
          </section>
          <section>
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
