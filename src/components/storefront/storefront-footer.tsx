import Link from "next/link";

const socialButtons = [
  "Instagram",
  "TikTok",
  "Facebook",
  "WhatsApp",
  "Snapchat",
  "YouTube",
  "X",
  "Email"
];

export function StorefrontFooter() {
  return (
    <footer className="storefront-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="scene-kicker">Stay close</span>
          <h2>Oh My Kitty</h2>
          <p>Soft care, daily confidence, and product updates in one place.</p>
        </div>

        <div className="footer-socials" aria-label="Social media links">
          {socialButtons.map((label) => (
            <button className="footer-social-button" key={label} type="button">
              <span>{label.slice(0, 1)}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="footer-bottom">
          <div className="footer-legal-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms & Conditions</a>
          </div>
          <p>Social links are ready for the final account URLs.</p>
        </div>
      </div>
      <Link className="footer-admin-peek" href="/admin/login">
        Admin login
      </Link>
    </footer>
  );
}
