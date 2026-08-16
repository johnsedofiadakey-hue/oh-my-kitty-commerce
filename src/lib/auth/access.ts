import { canAccessAdmin, canAccessPos, type Role, type UserAccess } from "@/lib/permissions/permissions";

export type AppSurface = "storefront" | "admin" | "pos";

export type AccessCheck = {
  allowed: boolean;
  surface: AppSurface;
  reason?: string;
};

export function checkSurfaceAccess(surface: AppSurface, roles: Role[], user?: UserAccess): AccessCheck {
  if (surface === "storefront") {
    return { allowed: true, surface };
  }

  if (!user) {
    return {
      allowed: false,
      surface,
      reason: "Authentication required."
    };
  }

  if (surface === "admin" && canAccessAdmin(roles, user)) {
    return { allowed: true, surface };
  }

  if (surface === "pos" && canAccessPos(roles, user)) {
    return { allowed: true, surface };
  }

  return {
    allowed: false,
    surface,
    reason: "Required role or permission is missing."
  };
}
