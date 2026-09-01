import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav, type AdminNavGroup } from "@/components/admin/admin-nav";
import { AdminHelpWidget } from "@/components/admin/admin-help-widget";
import type { AdminIconName } from "@/components/admin/admin-icons";
import { getAdminOperationsData } from "@/lib/admin/operations-data";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { canAccessAdmin, canAccessPos, hasPermission, type Permission } from "@/lib/permissions/permissions";
import { getEffectiveRoles, type CommerceActor } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";

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
      { label: "Financial", href: "/admin/financial", icon: "financial", requiredPermission: "reports.financial" },
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

  const context = getCommerceServerContext();
  const roles = context ? await getEffectiveRoles(context, actor.roleIds) : [];

  // A POS-only account with orders.view (e.g. Sales Staff) still needs a way
  // to reach Orders to fulfil pickups — without this they'd be bounced back
  // to /pos before the nav filtering below even runs.
  const canReachOrdersOnly = canAccessPos(roles, actor) && hasPermission(roles, actor, "orders.view");

  if (!canAccessAdmin(roles, actor) && !canReachOrdersOnly) {
    if (canAccessPos(roles, actor)) {
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
        .filter((item) => hasPermission(roles, actor, item.requiredPermission))
        .map((item) => ({
          label: item.label,
          href: item.href,
          icon: item.icon,
          badge: item.badgeKey ? badgeCounts[item.badgeKey] || undefined : undefined
        }))
    }))
    .filter((group) => group.items.length > 0);

  // POS access is a combined check (pos.access + pos.sell + posEnabled), not
  // a single permission, so it can't live in navConfig's generic filter —
  // this account also has admin.access (Owner/Manager), so the layout's own
  // redirect to /pos never fires for them and they'd otherwise have no way
  // to find it from inside the admin UI at all.
  if (canAccessPos(roles, actor)) {
    const salesGroup = groups.find((group) => group.label === "Sales");
    const posItem = { label: "POS", href: "/pos", icon: "pos" as const };
    if (salesGroup) {
      salesGroup.items.unshift(posItem);
    } else {
      groups.push({ label: "Sales", items: [posItem] });
    }
  }

  const actorRole = roles.find((role) => actor.roleIds.includes(role.id))?.name ?? "Staff";

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
      <AdminHelpWidget />
    </div>
  );
}
