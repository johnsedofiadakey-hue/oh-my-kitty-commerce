import { describe, expect, it } from "vitest";
import {
  canAccessAdmin,
  canAccessPos,
  defaultRoles,
  getGrantedPermissions,
  getHighestRoleLimit,
  hasPermission,
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
