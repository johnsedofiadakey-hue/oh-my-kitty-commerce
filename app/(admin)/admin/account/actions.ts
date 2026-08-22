"use server";

import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { writeAuditLog } from "@/lib/commerce/operations";

/**
 * Called right after a successful password change, once the caller has
 * already re-signed-in and refreshed its own session cookie. Firebase Auth
 * itself automatically invalidates every other existing session the moment
 * updatePassword() succeeds — no explicit revoke call is needed, or even
 * possible to make safely here: this runs after the refresh specifically
 * because the *old* session cookie is already dead by that point, so a call
 * that depended on it (as an explicit revokeRefreshTokens step would) would
 * itself fail. This action only records the change in the audit log.
 */
export async function logPasswordChangeAction(): Promise<void> {
  const actor = await getRequiredAdminActor();
  const context = getCommerceServerContext();
  if (!context) {
    return;
  }

  await writeAuditLog(context, actor, {
    action: "users.change_password",
    entityType: "user",
    entityId: actor.uid,
    summary: "Changed their own password"
  });
}
