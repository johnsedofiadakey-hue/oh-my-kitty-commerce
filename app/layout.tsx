import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const SEO_KEYWORDS = [
  "feminine wellness Ghana",
  "intimate care products Ghana",
  "feminine hygiene Accra",
  "yoni care Ghana",
  "boric acid suppositories Ghana",
  "infection care set Ghana",
  "period care products Ghana",
  "libido support Ghana",
  "razor bump treatment Ghana",
  "feminine wash Ghana",
  "Accra Madina pickup",
  "Oh My Kitty Ghana"
];

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ohmykittygh.com"),
  title: {
    default: "Oh My Kitty",
    template: "%s | Oh My Kitty"
  },
  description: "Feminine wellness and intimate care, shipped or picked up in Accra, Ghana.",
  keywords: SEO_KEYWORDS,
  applicationName: "Oh My Kitty Commerce",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/icons/apple-touch-icon.png"
  },
  openGraph: {
    siteName: "Oh My Kitty",
    type: "website",
    locale: "en_GH",
    url: "/",
    title: "Oh My Kitty — Intimate care, naturally.",
    description: "Feminine wellness and intimate care, shipped or picked up in Accra, Ghana."
  },
  twitter: {
    card: "summary_large_image",
    title: "Oh My Kitty — Intimate care, naturally.",
    description: "Feminine wellness and intimate care, shipped or picked up in Accra, Ghana."
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light",
  themeColor: "#f3a99d"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={inter.variable} lang="en">
      <head>
        <link href="https://api.fontshare.com" rel="preconnect" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
