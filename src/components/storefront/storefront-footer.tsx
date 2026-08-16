import Link from "next/link";

const socialButtons = [
  {
    href: "https://www.instagram.com/ohmykitty_30/",
    icon: "instagram",
    label: "Instagram"
  },
  {
    href: "https://www.tiktok.com/@ohmykitty_30",
    icon: "tiktok",
    label: "TikTok"
  },
  {
    href: "https://www.facebook.com/61572779391839/",
    icon: "facebook",
    label: "Facebook"
  },
  {
    href: "https://wa.me/233241448231",
    icon: "whatsapp",
    label: "WhatsApp"
  },
  {
    href: "https://www.snapchat.com/add/ohmykitty_30",
    icon: "snapchat",
    label: "Snapchat"
  }
] as const;

type SocialIcon = (typeof socialButtons)[number]["icon"];

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
          {socialButtons.map((social) => (
            <a
              aria-label={social.label}
              className="footer-social-button"
              href={social.href}
              key={social.label}
              rel="noreferrer"
              target="_blank"
              title={social.label}
            >
              <SocialIcon name={social.icon} />
            </a>
          ))}
        </div>

        <div className="footer-bottom">
          <div className="footer-legal-links">
            <a href="/faq">FAQ</a>
            <a href="/contact">Contact</a>
            <a href="/delivery">Delivery</a>
            <a href="/returns">Returns</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms & Conditions</a>
          </div>
          <p>@ohmykitty_30 / Accra-Madina / WhatsApp 0241448231</p>
        </div>
      </div>
      <Link className="footer-admin-peek" href="/admin/login">
        Admin login
      </Link>
    </footer>
  );
}

function SocialIcon({ name }: { name: SocialIcon }) {
  if (name === "instagram") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect height="16" rx="5" width="16" x="4" y="4" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="16.8" cy="7.2" r="1" />
      </svg>
    );
  }

  if (name === "tiktok") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M14 4v10.1a4.3 4.3 0 1 1-3.3-4.2" />
        <path d="M14 5.5c.8 2.4 2.5 3.9 5 4.3" />
      </svg>
    );
  }

  if (name === "facebook") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M14 8h3V4h-3c-3.2 0-5 1.9-5 5v3H6v4h3v4h4v-4h3.2l.8-4h-4V9.2c0-.8.4-1.2 1-1.2Z" />
      </svg>
    );
  }

  if (name === "whatsapp") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M6.2 18.4 7 15.6a7 7 0 1 1 2.5 2.3Z" />
        <path d="M9.6 8.6c.3 2.7 2.2 4.8 5.1 5.7l1.2-1.2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 4c3 0 5.4 2.5 5.4 5.6v3.1l1.8 1.6c-1 .3-1.9.7-2.4 1.4-.7 1-1.7 1.7-3.1 1.2-.8 1.4-2.6 1.4-3.4 0-1.4.5-2.4-.2-3.1-1.2-.5-.7-1.4-1.1-2.4-1.4l1.8-1.6V9.6C6.6 6.5 9 4 12 4Z" />
      <path d="M9.4 10.4h.1M14.5 10.4h.1" />
    </svg>
  );
}
