import Image from "next/image";
import Link from "next/link";
import { toWhatsAppLink } from "@/lib/storefront/whatsapp";

type StorefrontFooterProps = {
  variant?: "full" | "minimal";
  whatsappNumber: string;
};

type SocialIcon = "instagram" | "tiktok" | "snapchat" | "whatsapp";

export function StorefrontFooter({ variant = "full", whatsappNumber }: StorefrontFooterProps) {
  const socialButtons = [
    {
      href: "https://www.instagram.com/ohmykitty_30/",
      icon: "instagram" as SocialIcon,
      label: "Instagram"
    },
    {
      href: "https://www.tiktok.com/@ohmykitty_30",
      icon: "tiktok" as SocialIcon,
      label: "TikTok"
    },
    {
      href: "https://snapchat.com/t/d02oD04F",
      icon: "snapchat" as SocialIcon,
      label: "Snapchat"
    },
    {
      href: toWhatsAppLink(whatsappNumber),
      icon: "whatsapp" as SocialIcon,
      label: "WhatsApp"
    }
  ];

  return (
    <footer className="storefront-footer">
      {/* Cinematic final brand scene — full-screen, product overlapping the
          wordmark. Dissolves into the minimal functional footer below.
          Skipped on transactional pages (cart/checkout) so the flow stays
          short — the brand moment belongs to browsing, not to checkout. */}
      {variant === "full" ? (
        <section className="footer-cinematic" aria-hidden="true">
          <div className="footer-scene">
            <Image alt="" fill sizes="900px" src="/hero/architecture/peach-portal.svg" />
          </div>
          <div className="footer-botanical" aria-hidden="true">
            <Image alt="" fill sizes="220px" src="/hero/botanicals/leaf-foreground-01.svg" />
          </div>
          <div className="footer-wordmark">
            <span>OH MY</span>
            <span>KITTY</span>
          </div>
          <div className="footer-scene-bottle">
            <Image alt="" fill sizes="280px" src="/hero/products/slippery-elm.png" />
          </div>
          <p className="footer-closing-line">Made for every version of her.</p>
        </section>
      ) : null}

      <div className="footer-minimal">
        <div className="footer-minimal-inner">
          <Link className="brand-lockup" href="/">
            <span aria-hidden="true" className="brand-lockup-icon">
              <Image
                alt=""
                fill
                sizes="40px"
                src="/brand/oh-my-kitty-logo.jpeg"
                style={{ objectFit: "cover", transform: "scale(2) translate(-2%, -10%)" }}
              />
            </span>
            <span className="brand-lockup-text">
              <strong>Oh My Kitty</strong>
              <small>intimate care</small>
            </span>
          </Link>

          <nav className="footer-legal-links" aria-label="Support">
            <a href="/faq">FAQ</a>
            <a href="/contact">Contact</a>
            <a href="/delivery">Delivery</a>
            <a href="/returns">Returns</a>
            <a href="/track">Track order</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </nav>

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

          <Link className="footer-admin-link" href="/admin/login">
            Admin
          </Link>

          <p className="footer-credit">
            Built and powered by{" "}
            <a href="https://stormglide.io" rel="noreferrer" target="_blank">
              stormglide.io
            </a>
          </p>
        </div>
      </div>
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

  if (name === "snapchat") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 3.5c-3.6 0-6.5 3-6.5 6.7v7.3l1.8-1.6 1.7 1.6 1.7-1.6 1.7 1.6 1.6-1.6 1.7 1.6 1.8-1.6v-7.3c0-3.7-2.9-6.7-6.5-6.7Z" />
        <circle cx="9.6" cy="10.2" r="0.9" />
        <circle cx="14.4" cy="10.2" r="0.9" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6.2 18.4 7 15.6a7 7 0 1 1 2.5 2.3Z" />
      <path d="M9.6 8.6c.3 2.7 2.2 4.8 5.1 5.7l1.2-1.2" />
    </svg>
  );
}
