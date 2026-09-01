export const permissions = [
  "admin.access",
  "dashboard.view",
  "products.view",
  "products.create",
  "products.update",
  "products.archive",
  "products.delete",
  "products.publish",
  "products.price.update",
  "media.view",
  "media.upload",
  "media.delete",
  "content.view",
  "content.update",
  "orders.view",
  "orders.view_all",
  "orders.update_status",
  "orders.cancel",
  "orders.refund",
  "orders.void",
  "fulfilment.view",
  "fulfilment.update",
  "inventory.view",
  "inventory.receive",
  "inventory.adjust",
  "inventory.view_ledger",
  "customers.view",
  "customers.create",
  "customers.update",
  "customers.view_pii",
  "promotions.view",
  "promotions.create",
  "promotions.update",
  "promotions.delete",
  "reports.view",
  "reports.financial",
  "pos.access",
  "pos.sell",
  "pos.discount",
  "pos.price_override",
  "pos.refund",
  "pos.void",
  "pos.shift.open",
  "pos.shift.close",
  "pos.receipts.view",
  "users.view",
  "users.create",
  "users.update",
  "users.deactivate",
  "roles.view",
  "roles.create",
  "roles.update",
  "settings.view",
  "settings.update",
  "audit.view"
] as const;

export type Permission = (typeof permissions)[number];

export type RoleLimits = {
  maxDiscountPercent?: number;
  maxRefundAmount?: number;
  canOverridePrice?: boolean;
};

export type Role = {
  id: string;
  name: string;
  permissions: Permission[];
  limits?: RoleLimits;
  system?: boolean;
};

export type UserAccess = {
  uid: string;
  roleIds: string[];
  permissionOverrides?: Permission[];
  posEnabled?: boolean;
};

export function getGrantedPermissions(roles: Role[], user: UserAccess): Set<Permission> {
  const rolePermissions = roles
    .filter((role) => user.roleIds.includes(role.id))
    .flatMap((role) => role.permissions);

  return new Set([...rolePermissions, ...(user.permissionOverrides ?? [])]);
}

export function hasPermission(roles: Role[], user: UserAccess, permission: Permission) {
  return getGrantedPermissions(roles, user).has(permission);
}

export function canAccessAdmin(roles: Role[], user: UserAccess) {
  return hasPermission(roles, user, "admin.access");
}

export function canAccessPos(roles: Role[], user: UserAccess) {
  return (
    hasPermission(roles, user, "pos.access") &&
    hasPermission(roles, user, "pos.sell") &&
    user.posEnabled !== false
  );
}

export function getHighestRoleLimit(
  roles: Role[],
  user: UserAccess,
  limitKey: keyof RoleLimits
) {
  return roles
    .filter((role) => user.roleIds.includes(role.id))
    .map((role) => role.limits?.[limitKey])
    .filter((value): value is number => typeof value === "number")
    .reduce((highest, value) => Math.max(highest, value), 0);
}

export const defaultRoles: Role[] = [
  {
    id: "role-owner",
    name: "Owner",
    permissions: [...permissions],
    limits: {
      maxDiscountPercent: 100,
      maxRefundAmount: Number.MAX_SAFE_INTEGER,
      canOverridePrice: true
    },
    system: true
  },
  {
    id: "role-manager",
    name: "Manager",
    permissions: [
      "admin.access",
      "dashboard.view",
      "products.view",
      "media.view",
      "orders.view",
      "orders.view_all",
      "orders.update_status",
      "orders.cancel",
      "orders.refund",
      "orders.void",
      "fulfilment.view",
      "fulfilment.update",
      "inventory.view",
      "inventory.receive",
      "inventory.adjust",
      "inventory.view_ledger",
      "customers.view",
      "customers.create",
      "customers.update",
      "customers.view_pii",
      "promotions.view",
      "reports.view",
      "reports.financial",
      "pos.access",
      "pos.sell",
      "pos.discount",
      "pos.price_override",
      "pos.refund",
      "pos.void",
      "pos.shift.open",
      "pos.shift.close",
      "pos.receipts.view",
      "audit.view"
    ],
    limits: {
      maxDiscountPercent: 20,
      maxRefundAmount: 200000,
      canOverridePrice: true
    },
    system: true
  },
  {
    id: "role-sales-staff",
    name: "Sales Staff",
    permissions: [
      "pos.access",
      "pos.sell",
      "products.view",
      "orders.view",
      "customers.view",
      "customers.create",
      "pos.receipts.view",
      "pos.shift.open",
      "pos.shift.close"
    ],
    limits: {
      maxDiscountPercent: 0,
      maxRefundAmount: 0,
      canOverridePrice: false
    },
    system: true
  }
];
