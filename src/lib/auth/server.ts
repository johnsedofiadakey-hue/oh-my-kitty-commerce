import { cookies } from "next/headers";
import { CommerceError } from "@/lib/commerce/errors";
import type { CommerceActor } from "@/lib/commerce/operations";
import { getAdminAuth } from "@/lib/firebase/server";
import { adminSessionCookieName } from "@/lib/auth/session";

export async function getRequiredAdminActor(): Promise<CommerceActor> {
  const auth = getAdminAuth();
  if (!auth) {
    throw new CommerceError("INVALID_STATE", "Firebase Admin is not available yet.");
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(adminSessionCookieName)?.value;
  if (!sessionCookie) {
    throw new CommerceError("FORBIDDEN", "Sign in to admin before saving changes.");
  }

  const decoded = await auth.verifySessionCookie(sessionCookie, true);
  if (decoded.isAdmin !== true) {
    throw new CommerceError("FORBIDDEN", "This account does not have admin access.");
  }

  return {
    uid: decoded.uid,
    roleIds: parseRoleIds(decoded.roleIds)
  };
}

function parseRoleIds(value: unknown) {
  if (Array.isArray(value) && value.every((entry) => typeof entry === "string")) {
    return value;
  }

  return ["role-owner"];
}
