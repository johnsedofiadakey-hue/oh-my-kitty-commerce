import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CommerceError } from "@/lib/commerce/errors";
import { getEffectiveRoles, type CommerceActor } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getAdminAuth } from "@/lib/firebase/server";
import { hasPermission, type Permission } from "@/lib/permissions/permissions";
import { adminSessionCookieName } from "@/lib/auth/session";

/**
 * Cached per-request: the admin layout and every admin/POS page call this,
 * and each call would otherwise re-verify the session cookie against Firebase.
 */
export const getRequiredAdminActor = cache(async (): Promise<CommerceActor> => {
  const auth = getAdminAuth();
  if (!auth) {
    throw new CommerceError("INVALID_STATE", "Firebase Admin is not available yet.");
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(adminSessionCookieName)?.value;
  if (!sessionCookie) {
    throw new CommerceError("FORBIDDEN", "Sign in before saving changes.");
  }

  const decoded = await auth.verifySessionCookie(sessionCookie, true);
  if (decoded.isStaff !== true) {
    throw new CommerceError("FORBIDDEN", "This account does not have staff access.");
  }

  return {
    uid: decoded.uid,
    roleIds: parseRoleIds(decoded.roleIds),
    displayName: typeof decoded.name === "string" ? decoded.name : undefined,
    email: typeof decoded.email === "string" ? decoded.email : undefined,
    posEnabled: typeof decoded.posEnabled === "boolean" ? decoded.posEnabled : undefined
  };
});

/**
 * Verifies a manager's fresh Firebase ID token for a POS approval step (e.g.
 * a refund/void over the acting staff member's role limit). Unlike
 * getRequiredAdminActor this does not read the session cookie — the manager
 * proves their identity by re-entering their own credentials at the terminal,
 * independent of whoever is currently signed in.
 */
export async function verifyManagerApprover(idToken: string): Promise<CommerceActor> {
  const auth = getAdminAuth();
  if (!auth) {
    throw new CommerceError("INVALID_STATE", "Firebase Admin is not available yet.");
  }

  const decoded = await auth.verifyIdToken(idToken).catch(() => {
    throw new CommerceError("FORBIDDEN", "Manager sign-in could not be verified.");
  });

  if (decoded.isStaff !== true) {
    throw new CommerceError("FORBIDDEN", "That account does not have staff access.");
  }

  return {
    uid: decoded.uid,
    roleIds: parseRoleIds(decoded.roleIds)
  };
}

/**
 * Defense in depth for a specific admin page: `admin.access`/`pos.access` gate
 * the layout shell, but a direct URL visit must still be blocked per-section
 * even if the sidebar already hid the link. Redirects rather than throwing,
 * since a page component rendering this has no error boundary of its own.
 */
export async function requireAdminPermission(permission: Permission): Promise<CommerceActor> {
  const actor = await getRequiredAdminActor();
  const roles = await effectiveRolesForActor(actor);
  if (!hasPermission(roles, actor, permission)) {
    redirect("/admin");
  }

  return actor;
}

/** Falls back to no roles (i.e. no permissions) if Firestore isn't reachable — never silently grants access. */
async function effectiveRolesForActor(actor: CommerceActor) {
  const context = getCommerceServerContext();
  if (!context) {
    return [];
  }

  return getEffectiveRoles(context, actor.roleIds);
}

function parseRoleIds(value: unknown) {
  if (Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === "string")) {
    return value;
  }

  // No safe default here: a missing/malformed roleIds claim must grant
  // nothing, not fall back to the owner role, now that any staff account
  // (not just the bootstrapped owner) can obtain a session.
  return [];
}
