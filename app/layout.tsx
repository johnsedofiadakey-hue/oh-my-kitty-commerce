import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ohmyk1tty.web.app"),
  title: {
    default: "Oh My Kitty",
    template: "%s | Oh My Kitty"
  },
  description: "Mobile-first feminine wellness commerce for Oh My Kitty.",
  applicationName: "Oh My Kitty Commerce",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/icons/apple-touch-icon.png"
  },
  openGraph: {
    siteName: "Oh My Kitty",
    type: "website"
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
