import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="legal-page">
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">404</span>
        <h1>We couldn&apos;t find that page.</h1>
        <div className="legal-card">
          <section data-section-number="01">
            <h2>Let&apos;s get you back on track</h2>
            <p>
              The page you&apos;re looking for may have moved or no longer exists.{" "}
              <Link href="/">Return to the homepage</Link> or{" "}
              <Link href="/shop">browse the shop</Link>.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
