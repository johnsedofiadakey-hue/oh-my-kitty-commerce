import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { canAccessAdmin, canAccessPos, defaultRoles, hasPermission, type Permission } from "@/lib/permissions/permissions";
import type { CommerceActor } from "@/lib/commerce/operations";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", requiredPermission: "dashboard.view" },
  { label: "Products", href: "/admin/products", requiredPermission: "products.view" },
  { label: "Taxonomy", href: "/admin/taxonomy", requiredPermission: "products.view" },
  { label: "Orders", href: "/admin/orders", requiredPermission: "orders.view" },
  { label: "Inventory", href: "/admin/inventory", requiredPermission: "inventory.view" },
  { label: "Customers", href: "/admin/customers", requiredPermission: "customers.view" },
  { label: "Promotions", href: "/admin/promotions", requiredPermission: "promotions.view" },
  { label: "Content & Media", href: "/admin/content", requiredPermission: "content.view" },
  { label: "Delivery", href: "/admin/delivery", requiredPermission: "settings.view" },
  { label: "Reports", href: "/admin/reports", requiredPermission: "reports.view" },
  { label: "Users & Roles", href: "/admin/users", requiredPermission: "users.view" },
  { label: "Settings", href: "/admin/settings", requiredPermission: "settings.view" },
  { label: "Audit", href: "/admin/audit", requiredPermission: "audit.view" }
] as const satisfies ReadonlyArray<{ label: string; href: string; requiredPermission: Permission }>;

export default async function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  let actor: CommerceActor;

  try {
    actor = await getRequiredAdminActor();
  } catch {
    redirect("/admin/login");
  }

  if (!canAccessAdmin(defaultRoles, actor)) {
    if (canAccessPos(defaultRoles, actor)) {
      redirect("/pos");
    }

    return (
      <main className="app-main">
        <div className="page-heading">
          <div>
            <h1 className="app-title">Access pending</h1>
            <p className="app-subtitle">
              Your account is signed in but doesn&apos;t have admin or POS access yet. Ask an
              owner to assign you a role.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const visibleNavItems = adminNavItems.filter((item) =>
    hasPermission(defaultRoles, actor, item.requiredPermission)
  );

  return (
    <div className="app-shell">
      <AdminNav items={visibleNavItems} />
      <main className="app-main">{children}</main>
    </div>
  );
}
