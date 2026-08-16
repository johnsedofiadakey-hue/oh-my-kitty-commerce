import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Oh My Kitty",
    template: "%s | Oh My Kitty"
  },
  description: "Mobile-first feminine wellness commerce for Oh My Kitty.",
  applicationName: "Oh My Kitty Commerce"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
