import Link from "next/link";

export default function DeliveryPage() {
  return (
    <main className="legal-page">
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">Delivery</span>
        <h1>Pickup and delivery.</h1>
        <div className="legal-card">
          <section>
            <h2>Pickup</h2>
            <p>Pickup can be selected at checkout. The store should confirm readiness by phone or WhatsApp.</p>
          </section>
          <section>
            <h2>Accra delivery</h2>
            <p>Accra delivery is available in checkout with a starter fee. Admin can edit the final fee later.</p>
          </section>
          <section>
            <h2>Nationwide delivery</h2>
            <p>
              Nationwide delivery is prepared in the checkout flow. Final courier timing and fees
              should be confirmed before launch.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
