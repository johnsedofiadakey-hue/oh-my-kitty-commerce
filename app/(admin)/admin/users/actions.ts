"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import {
  createRole,
  createStaffUser,
  deleteRole,
  getEffectiveRoles,
  updateRole,
  updateStaffUser,
  writeAuditLog,
  type CommerceContext
} from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { getAdminAuth } from "@/lib/firebase/server";
import { hasPermission, type Permission } from "@/lib/permissions/permissions";
import {
  formOptionalInteger,
  formOptionalMoneyMinorUnit,
  formString,
  type AdminActionState
} from "@/lib/admin/product-form";

export async function inviteStaffAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await requirePermission(context, actor, "users.create");
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
  await requirePermission(context, actor, "users.update");
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

export async function resetStaffPasswordAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await requirePermission(context, actor, "users.update");
    const auth = requireAdminAuth();

    const id = formString(formData, "id");
    const newPassword = formString(formData, "newPassword");

    if (newPassword.length < 6) {
      throw new CommerceError("VALIDATION_ERROR", "Password must be at least 6 characters.");
    }

    const targetUser = await auth.updateUser(id, { password: newPassword });

    await writeAuditLog(context, actor, {
      action: "users.reset_password",
      entityType: "user",
      entityId: id,
      summary: `Reset password for ${targetUser.email ?? targetUser.displayName ?? id}`
    });

    return { status: "success", message: "Password reset." };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

export async function createRoleAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await requirePermission(context, actor, "roles.create");

    const name = formString(formData, "name");
    const rolePermissions = formData.getAll("permissions").map(String);
    if (rolePermissions.length === 0) {
      throw new CommerceError("VALIDATION_ERROR", "Choose at least one permission.");
    }

    const role = await createRole(context, actor, {
      name,
      permissions: rolePermissions,
      limits: parseRoleLimits(formData)
    });

    revalidatePath("/admin/users");
    return { status: "success", message: `Created role ${role.name}.` };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

export async function updateRoleAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await requirePermission(context, actor, "roles.update");

    const id = formString(formData, "id");
    const name = formString(formData, "name");
    const rolePermissions = formData.getAll("permissions").map(String);
    if (rolePermissions.length === 0) {
      throw new CommerceError("VALIDATION_ERROR", "Choose at least one permission.");
    }

    const role = await updateRole(context, actor, {
      id,
      name,
      permissions: rolePermissions,
      limits: parseRoleLimits(formData)
    });

    revalidatePath("/admin/users");
    return { status: "success", message: `Updated role ${role.name}.` };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

export async function deleteRoleAction(formData: FormData): Promise<void> {
  const context = requireCommerceContext();
  const actor = await getRequiredAdminActor();
  await requirePermission(context, actor, "roles.update");

  await deleteRole(context, actor, formString(formData, "id"));
  revalidatePath("/admin/users");
}

function parseRoleLimits(formData: FormData) {
  const maxDiscountPercent = formOptionalInteger(formData, "maxDiscountPercent");
  const maxRefundAmount = formOptionalMoneyMinorUnit(formData, "maxRefundAmount");
  const canOverridePrice = formData.get("canOverridePrice") === "on";

  if (maxDiscountPercent === undefined && maxRefundAmount === null && !canOverridePrice) {
    return undefined;
  }

  return {
    maxDiscountPercent,
    maxRefundAmount: maxRefundAmount ?? undefined,
    canOverridePrice
  };
}

async function requirePermission(
  context: CommerceContext,
  actor: { uid: string; roleIds: string[] },
  permission: Permission
) {
  const roles = await getEffectiveRoles(context, actor.roleIds);
  if (!hasPermission(roles, actor, permission)) {
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
