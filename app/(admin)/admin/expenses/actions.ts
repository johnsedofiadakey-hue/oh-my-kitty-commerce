"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import {
  createExpense,
  createExpenseCategory,
  createMediaAsset,
  createRecurringExpenseTemplate,
  deleteExpense,
  deleteRecurringExpenseTemplate,
  logRecurringExpense,
  updateExpense,
  updateExpenseCategory
} from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import {
  formDate,
  formInteger,
  formMoneyMinorUnit,
  formOptionalString,
  formString,
  slugFromTitle,
  type AdminActionState
} from "@/lib/admin/product-form";

export async function createExpenseCategoryAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    const title = formString(formData, "title");

    const category = await createExpenseCategory(context, actor, {
      title,
      slug: formOptionalString(formData, "slug") ?? slugFromTitle(title),
      sortOrder: formInteger(formData, "sortOrder", 0)
    });

    return `Created category ${category.title}.`;
  }, "/admin/financial");
}

export async function quickEditExpenseCategoryAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const category = await updateExpenseCategory(context, actor, {
      id: formString(formData, "id"),
      title: formString(formData, "title"),
      sortOrder: formInteger(formData, "sortOrder", 0),
      active: formData.get("active") === "on"
    });

    return `Saved ${category.title}.`;
  }, "/admin/financial");
}

export async function createExpenseAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    await createExpense(context, actor, {
      categoryId: formString(formData, "categoryId"),
      name: formOptionalString(formData, "name"),
      amount: formMoneyMinorUnit(formData, "amount"),
      date: formDate(formData, "date"),
      note: formOptionalString(formData, "note")
    });

    return "Expense logged.";
  }, "/admin/financial");
}

export async function updateExpenseAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    await updateExpense(context, actor, {
      id: formString(formData, "id"),
      categoryId: formString(formData, "categoryId"),
      name: formOptionalString(formData, "name"),
      amount: formMoneyMinorUnit(formData, "amount"),
      date: formDate(formData, "date"),
      note: formOptionalString(formData, "note")
    });

    return "Expense updated.";
  }, "/admin/financial");
}

/**
 * Attaches an uploaded photo of the receipt to an expense. The file itself is
 * already in storage by this point — the browser uploads it directly, same as
 * product images — so this only records the media asset and links it.
 */
export async function attachExpenseReceiptAction(
  expenseId: string,
  input: { storagePath: string; url: string; alt: string }
): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const asset = await createMediaAsset(context, actor, {
      storagePath: input.storagePath,
      url: input.url,
      alt: input.alt,
      usage: ["expense-receipt"]
    });
    await updateExpense(context, actor, { id: expenseId, receiptMediaId: asset.id });

    return "Receipt attached.";
  }, "/admin/financial");
}

export async function removeExpenseReceiptAction(expenseId: string): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await updateExpense(context, actor, { id: expenseId, receiptMediaId: null });
    return "Receipt removed.";
  }, "/admin/financial");
}

export async function deleteExpenseAction(expenseId: string): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await deleteExpense(context, actor, expenseId);
    return "Expense deleted.";
  }, "/admin/financial");
}

export async function createRecurringExpenseTemplateAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const template = await createRecurringExpenseTemplate(context, actor, {
      categoryId: formString(formData, "categoryId"),
      label: formString(formData, "label"),
      amount: formMoneyMinorUnit(formData, "amount"),
      dayOfMonth: formInteger(formData, "dayOfMonth", 1)
    });

    return `Added recurring expense ${template.label}.`;
  }, "/admin/financial");
}

export async function deleteRecurringExpenseTemplateAction(templateId: string): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await deleteRecurringExpenseTemplate(context, actor, templateId);
    return "Recurring expense deleted.";
  }, "/admin/financial");
}

export async function logRecurringExpenseAction(templateId: string, period: string): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await logRecurringExpense(context, actor, { templateId, period, date: new Date() });
    return "Logged as paid for this period.";
  }, "/admin/financial");
}

async function runAction(
  operation: () => Promise<string>,
  ...paths: string[]
): Promise<AdminActionState> {
  try {
    const message = await operation();
    for (const path of paths) {
      revalidatePath(path);
    }
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
