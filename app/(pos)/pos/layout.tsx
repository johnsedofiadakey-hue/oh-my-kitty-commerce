export default function PosLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="pos-shell">{children}</div>;
}
