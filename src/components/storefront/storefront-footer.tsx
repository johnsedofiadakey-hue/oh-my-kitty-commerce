import Image from "next/image";
import Link from "next/link";
import { toWhatsAppLink } from "@/lib/storefront/whatsapp";

type StorefrontFooterProps = {
  variant?: "full" | "minimal";
  whatsappNumber: string;
};

type SocialIcon = "instagram" | "tiktok" | "facebook" | "snapchat" | "whatsapp";

const SUPPORT_LINKS = [
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/delivery", label: "Delivery" },
  { href: "/returns", label: "Returns" },
  { href: "/track", label: "Track order" }
];

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
      href: "https://www.facebook.com/ohmykitty_30",
      icon: "facebook" as SocialIcon,
      label: "Facebook"
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
      <div className="footer-dock-shell">
        <div className="footer-dock">
          <Link aria-label="Oh My Kitty home" className="footer-dock-brand" href="/">
            <span aria-hidden="true" className="footer-dock-logo">
              <Image
                alt=""
                fill
                sizes="34px"
                src="/brand/oh-my-kitty-logo.jpeg"
                style={{ objectFit: "cover", transform: "scale(2) translate(-2%, -10%)" }}
              />
            </span>
            <span className="footer-dock-brand-text">Oh My Kitty</span>
          </Link>

          <div className="footer-dock-socials" aria-label="Social media links">
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

          <div className="footer-dock-tail">
            <nav className="footer-dock-legal" aria-label="Legal">
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
            </nav>

            <Link aria-label="Admin login" className="footer-admin-peek" href="/admin/login">
              <span aria-hidden="true" className="footer-admin-lock" />
              <strong>Admin</strong>
            </Link>
          </div>
        </div>

        {variant === "full" ? (
          <nav className="footer-support-row" aria-label="Support">
            {SUPPORT_LINKS.map((link) => (
              <a href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}

        <p className="footer-credit">
          Built and powered by{" "}
          <a href="https://stormglide.io" rel="noreferrer" target="_blank">
            stormglide.io
          </a>
        </p>
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

  if (name === "facebook") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M14.4 8H17V4.5h-2.9c-3.2 0-5.1 1.9-5.1 5.2V12H6v3.6h3V21h3.9v-5.4h3.2l.6-3.6h-3.8v-1.9c0-1.1.5-2.1 1.5-2.1Z" />
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
