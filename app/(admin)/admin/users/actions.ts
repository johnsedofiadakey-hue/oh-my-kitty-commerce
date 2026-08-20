"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import { createStaffUser, updateStaffUser } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { getAdminAuth } from "@/lib/firebase/server";
import { defaultRoles, hasPermission, type Permission } from "@/lib/permissions/permissions";
import { formString, type AdminActionState } from "@/lib/admin/product-form";

export async function inviteStaffAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    requirePermission(actor, "users.create");
    const auth = requireAdminAuth();

    const displayName = formString(formData, "displayName");
    const email = formString(formData, "email");
    const password = formString(formData, "password");
    const roleIds = formData.getAll("roleIds").map(String);
    const posEnabled = formData.get("posEnabled") === "on";

    if (roleIds.length === 0) {
      throw new CommerceError("VALIDATION_ERROR", "Choose at least one role.");
    }

    if (password.length < 6) {
      throw new CommerceError("VALIDATION_ERROR", "Password must be at least 6 characters.");
    }

    // Auth user + claims are created first so the account only ever exists
    // once we're sure the caller is allowed to create it (requirePermission
    // above) — createStaffUser below then just records the resulting uid.
    const authUser = await auth.createUser({ email, displayName, password });
    await auth.setCustomUserClaims(authUser.uid, {
      isStaff: true,
      roleIds,
      posEnabled,
      permissionsVersion: 1
    });

    await createStaffUser(context, actor, {
      id: authUser.uid,
      uid: authUser.uid,
      displayName,
      email,
      status: "ACTIVE",
      roleIds,
      type: "ADMIN_OR_STAFF",
      posEnabled,
      permissionOverrides: []
    });

    revalidatePath("/admin/users");
    return {
      status: "success",
      message: `Invited ${displayName}. Sign in with ${email} and the password you set.`
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionErrorMessage(error)
    };
  }
}

export async function updateStaffAccessAction(formData: FormData): Promise<void> {
  const context = requireCommerceContext();
  const actor = await getRequiredAdminActor();
  requirePermission(actor, "users.update");
  const auth = requireAdminAuth();

  const id = formString(formData, "id");
  const roleIds = formData.getAll("roleIds").map(String);
  const status = formData.get("status") === "DEACTIVATED" ? "DEACTIVATED" : "ACTIVE";
  const posEnabled = formData.get("posEnabled") === "on";

  if (roleIds.length === 0) {
    throw new CommerceError("VALIDATION_ERROR", "Choose at least one role.");
  }

  await updateStaffUser(context, actor, {
    id,
    roleIds,
    status,
    posEnabled
  });

  // Deactivating clears isStaff so the account can no longer obtain a
  // session at all, not just lose permissions within one. Claims changes
  // take effect the next time the staff member signs in, not immediately.
  await auth.setCustomUserClaims(id, {
    isStaff: status === "ACTIVE",
    roleIds,
    posEnabled,
    permissionsVersion: 1
  });

  revalidatePath("/admin/users");
}

function requirePermission(actor: { uid: string; roleIds: string[] }, permission: Permission) {
  if (!hasPermission(defaultRoles, actor, permission)) {
    throw new CommerceError("FORBIDDEN", `Missing permission: ${permission}`);
  }
}

function requireCommerceContext() {
  const context = getCommerceServerContext();
  if (!context) {
    throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
  }

  return context;
}

function requireAdminAuth() {
  const auth = getAdminAuth();
  if (!auth) {
    throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
  }

  return auth;
}

function getActionErrorMessage(error: unknown) {
  if (error instanceof CommerceError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Save failed.";
}
