import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">Privacy</span>
        <h1>Privacy policy.</h1>
        <div className="legal-card">
          <section>
            <h2>Customer information</h2>
            <p>
              Oh My Kitty will use customer information to process orders, provide delivery,
              support customer service, prevent fraud, and improve the shopping experience.
            </p>
          </section>
          <section>
            <h2>Payments</h2>
            <p>
              Payment details should be handled by the selected payment provider. Sensitive payment
              credentials and card details must not be stored directly in this application.
            </p>
          </section>
          <section>
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
