import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSignOutButton } from "@/components/auth/admin-sign-out-button";
import { getRequiredAdminActor } from "@/lib/auth/server";

const adminNavItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Inventory", href: "/admin/inventory" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Promotions", href: "/admin/promotions" },
  { label: "Content & Media", href: "/admin/content" },
  { label: "Delivery", href: "/admin/delivery" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Users & Roles", href: "/admin/users" },
  { label: "Settings", href: "/admin/settings" },
  { label: "Audit", href: "/admin/audit" }
] as const;

export default async function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    await getRequiredAdminActor();
  } catch {
    redirect("/admin/login");
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="admin-brand" href="/admin">
          <Image
            src="/brand/oh-my-kitty-logo.jpeg"
            alt="Oh My Kitty logo"
            width={54}
            height={54}
            priority
          />
          <span>Oh My Kitty Admin</span>
        </Link>
        <nav className="nav-list" aria-label="Admin">
          {adminNavItems.map((item) => (
            <Link className="nav-item" href={item.href as Route} key={item.href}>
              {item.label}
            </Link>
          ))}
          <AdminSignOutButton />
        </nav>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}
