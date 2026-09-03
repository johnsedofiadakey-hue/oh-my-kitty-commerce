"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import {
  acknowledgeNotificationLog,
  registerPushSubscription,
  type RegisterPushSubscriptionInput
} from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { formString, type AdminActionState } from "@/lib/admin/product-form";

/**
 * Called directly from register-push-notifications.tsx after getToken()
 * resolves — not tied to a <form>, so it's a plain function rather than the
 * (previousState, formData) shape the rest of this codebase's actions use.
 * Fails quietly (returns ok: false) rather than throwing: a failed
 * registration should not break the page the staff member is looking at.
 */
export async function registerPushSubscriptionAction(
  input: RegisterPushSubscriptionInput
): Promise<{ ok: boolean }> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await registerPushSubscription(context, actor, input);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function acknowledgeNotificationAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await acknowledgeNotificationLog(context, actor, formString(formData, "id"));
    revalidatePath("/admin/notifications");
    return { status: "success", message: "Acknowledged." };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

function requireCommerceContext() {
  const context = getCommerceServerContext();
  if (!context) {
    throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
  }

  return context;
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
