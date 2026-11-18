import { describe, expect, it } from "vitest";
import {
  canAccessAdmin,
  canAccessPos,
  defaultRoles,
  getGrantedPermissions,
  getHighestRoleLimit,
  hasPermission,
  permissions,
  type UserAccess
} from "@/lib/permissions/permissions";

describe("permissions", () => {
  const owner: UserAccess = {
    uid: "owner",
    roleIds: ["role-owner"]
  };

  const salesStaff: UserAccess = {
    uid: "staff",
    roleIds: ["role-sales-staff"]
  };

  // The shop's rule is that every sale is final: nobody refunds or voids one,
  // not even the owner. If a permission for it ever comes back, this fails.
  it("has no permission to refund or void a sale, for any role", () => {
    const everyPermission = new Set([
      ...permissions,
      ...defaultRoles.flatMap((role) => role.permissions)
    ]);

    expect([...everyPermission].filter((permission) => /refund|void/i.test(permission))).toEqual([]);
    expect(defaultRoles.some((role) => role.limits && "maxRefundAmount" in role.limits)).toBe(false);
  });

  it("grants owner full access", () => {
    expect(canAccessAdmin(defaultRoles, owner)).toBe(true);
    expect(canAccessPos(defaultRoles, owner)).toBe(true);
    expect(hasPermission(defaultRoles, owner, "roles.update")).toBe(true);
  });

  it("keeps default sales staff out of admin settings", () => {
    expect(canAccessAdmin(defaultRoles, salesStaff)).toBe(false);
    expect(canAccessPos(defaultRoles, salesStaff)).toBe(true);
    expect(hasPermission(defaultRoles, salesStaff, "settings.update")).toBe(false);
  });

  it("limits sales staff to POS and orders — no dashboard, no other sections", () => {
    expect(hasPermission(defaultRoles, salesStaff, "dashboard.view")).toBe(false);
    expect(hasPermission(defaultRoles, salesStaff, "orders.view")).toBe(true);
    expect(hasPermission(defaultRoles, salesStaff, "pos.access")).toBe(true);
    expect(hasPermission(defaultRoles, salesStaff, "customers.view")).toBe(false);
    expect(hasPermission(defaultRoles, salesStaff, "products.view")).toBe(false);
    expect(hasPermission(defaultRoles, salesStaff, "reports.view")).toBe(false);
  });

  it("supports explicit permission overrides", () => {
    const permissions = getGrantedPermissions(defaultRoles, {
      ...salesStaff,
      permissionOverrides: ["pos.discount"]
    });

    expect(permissions.has("pos.discount")).toBe(true);
  });

  it("reads numeric role limits", () => {
    expect(getHighestRoleLimit(defaultRoles, salesStaff, "maxDiscountPercent")).toBe(0);
    expect(getHighestRoleLimit(defaultRoles, owner, "maxDiscountPercent")).toBe(100);
  });
});
