export default function StorefrontLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="storefront-shell">{children}</div>;
}
