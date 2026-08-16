import Link from "next/link";

export default function FaqPage() {
  return (
    <main className="legal-page">
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">FAQ</span>
        <h1>Questions, answered softly.</h1>
        <div className="legal-card">
          <section>
            <h2>Can I order online and pick up?</h2>
            <p>
              Yes. Pickup is available in the checkout flow and can be confirmed by the store
              before fulfilment.
            </p>
          </section>
          <section>
            <h2>Are prices final?</h2>
            <p>
              The current catalogue is editable by admin. Final product prices, bundles, and
              promotions should be confirmed before public launch.
            </p>
          </section>
          <section>
            <h2>Can I contact the store before buying?</h2>
            <p>
              Yes. Use WhatsApp 0241448231 or the social icons in the footer for customer support.
            </p>
          </section>
          <section>
            <h2>Where are product instructions?</h2>
            <p>
              Follow the product packaging. Admin can add usage, ingredient, and warning details
              per product before launch.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
