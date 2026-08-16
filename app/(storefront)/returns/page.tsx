import Link from "next/link";

export default function ReturnsPage() {
  return (
    <main className="legal-page">
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">Returns</span>
        <h1>Returns and support.</h1>
        <div className="legal-card">
          <section>
            <h2>Before launch</h2>
            <p>
              The final return and exchange policy must be approved by the business before real
              checkout is enabled.
            </p>
          </section>
          <section>
            <h2>Intimate-care products</h2>
            <p>
              Some products may need stricter return rules for hygiene reasons. State those rules
              clearly before public launch.
            </p>
          </section>
          <section>
            <h2>Order support</h2>
            <p>Customers should contact WhatsApp 0241448231 with order number and delivery details.</p>
          </section>
        </div>
      </section>
    </main>
  );
}
