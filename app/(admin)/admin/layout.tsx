import Link from "next/link";

const adminNavItems = [
  "Dashboard",
  "Products",
  "Orders",
  "Inventory",
  "Customers",
  "Promotions",
  "Users",
  "Settings"
];

export default function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="brand-mark" href="/">
          Oh My Kitty Admin
        </Link>
        <nav className="nav-list" aria-label="Admin">
          {adminNavItems.map((item, index) => (
            <a className={index === 0 ? "nav-item active" : "nav-item"} href="#" key={item}>
              {item}
            </a>
          ))}
        </nav>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}
