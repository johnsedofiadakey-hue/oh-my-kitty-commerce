import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav, type AdminNavGroup } from "@/components/admin/admin-nav";
import type { AdminIconName } from "@/components/admin/admin-icons";
import { getAdminOperationsData } from "@/lib/admin/operations-data";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { canAccessAdmin, canAccessPos, defaultRoles, hasPermission, type Permission } from "@/lib/permissions/permissions";
import type { CommerceActor } from "@/lib/commerce/operations";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

type NavConfigItem = {
  label: string;
  href: string;
  icon: AdminIconName;
  requiredPermission: Permission;
  badgeKey?: "orders" | "inventory";
};

type NavConfigGroup = {
  label: string | null;
  items: NavConfigItem[];
};

const navConfig: NavConfigGroup[] = [
  {
    label: null,
    items: [{ label: "Dashboard", href: "/admin", icon: "overview", requiredPermission: "dashboard.view" }]
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: "products", requiredPermission: "products.view" },
      { label: "Categories", href: "/admin/categories", icon: "categories", requiredPermission: "products.view" },
      { label: "Taxonomy", href: "/admin/taxonomy", icon: "taxonomy", requiredPermission: "products.view" },
      { label: "Content & Media", href: "/admin/content", icon: "content", requiredPermission: "content.view" }
    ]
  },
  {
    label: "Sales",
    items: [
      {
        label: "Orders",
        href: "/admin/orders",
        icon: "orders",
        requiredPermission: "orders.view",
        badgeKey: "orders"
      },
      { label: "Customers", href: "/admin/customers", icon: "customers", requiredPermission: "customers.view" },
      { label: "Promotions", href: "/admin/promotions", icon: "promotions", requiredPermission: "promotions.view" }
    ]
  },
  {
    label: "Operations",
    items: [
      {
        label: "Inventory",
        href: "/admin/inventory",
        icon: "inventory",
        requiredPermission: "inventory.view",
        badgeKey: "inventory"
      },
      { label: "Delivery", href: "/admin/delivery", icon: "delivery", requiredPermission: "settings.view" }
    ]
  },
  {
    label: "Insights",
    items: [
      { label: "Reports", href: "/admin/reports", icon: "reports", requiredPermission: "reports.view" },
      { label: "Audit log", href: "/admin/audit", icon: "audit", requiredPermission: "audit.view" }
    ]
  },
  {
    label: "Admin",
    items: [
      { label: "Users & roles", href: "/admin/users", icon: "users", requiredPermission: "users.view" },
      { label: "Settings", href: "/admin/settings", icon: "settings", requiredPermission: "settings.view" }
    ]
  }
];

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

  const data = await getAdminOperationsData();
  const badgeCounts = {
    orders: data.orders.filter(
      (order) =>
        order.status !== "CANCELLED" &&
        (order.fulfilmentStatus === "UNFULFILLED" || order.fulfilmentStatus === "PROCESSING")
    ).length,
    inventory: data.metrics.lowStock
  };

  const groups: AdminNavGroup[] = navConfig
    .map((group) => ({
      label: group.label,
      items: group.items
        .filter((item) => hasPermission(defaultRoles, actor, item.requiredPermission))
        .map((item) => ({
          label: item.label,
          href: item.href,
          icon: item.icon,
          badge: item.badgeKey ? badgeCounts[item.badgeKey] || undefined : undefined
        }))
    }))
    .filter((group) => group.items.length > 0);

  const actorRole = defaultRoles.find((role) => actor.roleIds.includes(role.id))?.name ?? "Staff";

  return (
    <div className="app-shell">
      <a className="skip-link" href="#admin-main">
        Skip to content
      </a>
      <AdminNav
        actorName={actor.displayName ?? actor.email ?? "Staff"}
        actorRole={actorRole}
        groups={groups}
      />
      <main className="app-main" id="admin-main">
        {children}
      </main>
    </div>
  );
}
