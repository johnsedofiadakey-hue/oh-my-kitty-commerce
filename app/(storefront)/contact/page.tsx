import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="legal-page">
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">Contact</span>
        <h1>Reach the store.</h1>
        <div className="legal-card">
          <section>
            <h2>WhatsApp</h2>
            <p>0241448231 for order support, product questions, pickup, and delivery updates.</p>
          </section>
          <section>
            <h2>Location</h2>
            <p>Accra-Madina. Final map, directions, and opening hours can be added by admin.</p>
          </section>
          <section>
            <h2>Social</h2>
            <p>
              Instagram, TikTok, Facebook, WhatsApp, and Snapchat links are available in the
              footer.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
