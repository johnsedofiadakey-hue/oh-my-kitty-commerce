"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import { createCustomer, updateCustomer } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import {
  formOptionalString,
  formString,
  type AdminActionState
} from "@/lib/admin/product-form";

export async function createCustomerAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const customer = await createCustomer(context, actor, {
      name: formOptionalString(formData, "name"),
      email: formOptionalString(formData, "email"),
      phone: formOptionalString(formData, "phone"),
      createdFrom: "ADMIN_CREATED"
    });

    revalidatePath("/admin/customers");
    return { status: "success", message: `Created ${customer.name ?? "customer"}.` };
  } catch (error) {
    return { status: "error", message: getActionErrorMessage(error) };
  }
}

export async function updateCustomerAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const customer = await updateCustomer(context, actor, {
      id: formString(formData, "id"),
      name: formOptionalString(formData, "name"),
      email: formOptionalString(formData, "email"),
      phone: formOptionalString(formData, "phone")
    });

    revalidatePath("/admin/customers");
    return { status: "success", message: `Saved ${customer.name ?? "customer"}.` };
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
