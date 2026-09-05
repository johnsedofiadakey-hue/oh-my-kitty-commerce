"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import { createPayrollPayment, createWorker, deletePayrollPayment, deleteWorker, updateWorker } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import {
  formDate,
  formMoneyMinorUnit,
  formOptionalString,
  formString,
  type AdminActionState
} from "@/lib/admin/product-form";

function workerFieldsFromForm(formData: FormData) {
  return {
    name: formString(formData, "name"),
    role: formOptionalString(formData, "role"),
    status: (formData.get("status") === "INACTIVE" ? "INACTIVE" : "ACTIVE") as "ACTIVE" | "INACTIVE",
    monthlySalary: formMoneyMinorUnit(formData, "monthlySalary"),
    startDate: formOptionalString(formData, "startDate") ? formDate(formData, "startDate") : null,
    phone: formOptionalString(formData, "phone"),
    ghanaCardNumber: formOptionalString(formData, "ghanaCardNumber"),
    bankName: formOptionalString(formData, "bankName"),
    bankAccountNumber: formOptionalString(formData, "bankAccountNumber"),
    momoNumber: formOptionalString(formData, "momoNumber"),
    momoNetwork: formOptionalString(formData, "momoNetwork"),
    emergencyContactName: formOptionalString(formData, "emergencyContactName"),
    emergencyContactPhone: formOptionalString(formData, "emergencyContactPhone"),
    nextOfKinName: formOptionalString(formData, "nextOfKinName"),
    nextOfKinRelationship: formOptionalString(formData, "nextOfKinRelationship"),
    nextOfKinPhone: formOptionalString(formData, "nextOfKinPhone"),
    parentGuardianName: formOptionalString(formData, "parentGuardianName"),
    siblingsInfo: formOptionalString(formData, "siblingsInfo"),
    notes: formOptionalString(formData, "notes")
  };
}

export async function createWorkerAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    const worker = await createWorker(context, actor, workerFieldsFromForm(formData));
    return `Added worker ${worker.name}.`;
  }, "/admin/financial");
}

export async function updateWorkerAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    const worker = await updateWorker(context, actor, {
      id: formString(formData, "id"),
      ...workerFieldsFromForm(formData)
    });
    return `Saved ${worker.name}.`;
  }, "/admin/financial");
}

export async function deleteWorkerAction(workerId: string): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await deleteWorker(context, actor, workerId);
    return "Worker removed.";
  }, "/admin/financial");
}

export async function payWorkerAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const deductionLabel = formOptionalString(formData, "deductionLabel");
    const deductionAmount = formOptionalString(formData, "deductionAmount")
      ? formMoneyMinorUnit(formData, "deductionAmount")
      : 0;
    const deductions = deductionLabel && deductionAmount > 0 ? [{ label: deductionLabel, amount: deductionAmount }] : [];

    const payment = await createPayrollPayment(context, actor, {
      workerId: formString(formData, "workerId"),
      period: formString(formData, "period"),
      grossAmount: formMoneyMinorUnit(formData, "grossAmount"),
      deductions,
      paidDate: formDate(formData, "paidDate"),
      note: formOptionalString(formData, "note")
    });

    return `Paid for ${payment.period}.`;
  }, "/admin/financial");
}

export async function deletePayrollPaymentAction(paymentId: string): Promise<AdminActionState> {
  return runAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    await deletePayrollPayment(context, actor, paymentId);
    return "Payment record deleted.";
  }, "/admin/financial");
}

async function runAction(operation: () => Promise<string>, ...paths: string[]): Promise<AdminActionState> {
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
