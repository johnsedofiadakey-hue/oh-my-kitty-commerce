"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import { createManualRevenueEntry, deleteManualRevenueEntry } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { formDate, formMoneyMinorUnit, formOptionalString, formString, type AdminActionState } from "@/lib/admin/product-form";

export async function createManualRevenueEntryAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    const entry = await createManualRevenueEntry(context, actor, {
      label: formString(formData, "label"),
      amount: formMoneyMinorUnit(formData, "amount"),
      date: formDate(formData, "date"),
      note: formOptionalString(formData, "note")
    });
    return `Logged ${entry.label}.`;
  });
}

export async function deleteManualRevenueEntryAction(entryId: string): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await deleteManualRevenueEntry(context, actor, entryId);
    return "Entry deleted.";
  });
}

async function runAction(operation: () => Promise<string>): Promise<AdminActionState> {
  try {
    const message = await operation();
    revalidatePath("/admin/financial");
    return { status: "success", message };
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
