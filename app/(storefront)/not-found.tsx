import Link from "next/link";

export default function StorefrontNotFound() {
  return (
    <main className="legal-page">
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">404</span>
        <h1>We couldn&apos;t find that.</h1>
        <div className="legal-card">
          <section data-section-number="01">
            <h2>It may have sold out or moved</h2>
            <p>
              That product, category, or page isn&apos;t here anymore.{" "}
              <Link href="/shop">Browse the shop</Link> or{" "}
              <Link href="/track">track an existing order</Link>.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
