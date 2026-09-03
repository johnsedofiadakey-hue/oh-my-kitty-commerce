"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import {
  createConcern,
  createProductType,
  createRoutine,
  updateConcern,
  updateProductType,
  updateRoutine
} from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import {
  formInteger,
  formOptionalString,
  formString,
  slugFromTitle,
  type AdminActionState
} from "@/lib/admin/product-form";

export async function createConcernAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runTaxonomyAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    const title = formString(formData, "title");

    const concern = await createConcern(context, actor, {
      title,
      slug: formOptionalString(formData, "slug") ?? slugFromTitle(title),
      description: formOptionalString(formData, "description"),
      sortOrder: formInteger(formData, "sortOrder", 0)
    });

    return `Created concern ${concern.title}.`;
  });
}

export async function createProductTypeAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runTaxonomyAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    const title = formString(formData, "title");

    const productType = await createProductType(context, actor, {
      title,
      slug: formOptionalString(formData, "slug") ?? slugFromTitle(title),
      description: formOptionalString(formData, "description"),
      sortOrder: formInteger(formData, "sortOrder", 0)
    });

    return `Created product type ${productType.title}.`;
  });
}

export async function createRoutineAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runTaxonomyAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();
    const title = formString(formData, "title");

    const routine = await createRoutine(context, actor, {
      title,
      slug: formOptionalString(formData, "slug") ?? slugFromTitle(title),
      description: formOptionalString(formData, "description"),
      sortOrder: formInteger(formData, "sortOrder", 0)
    });

    return `Created routine ${routine.title}.`;
  });
}

export async function quickEditConcernAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runTaxonomyAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const concern = await updateConcern(context, actor, {
      id: formString(formData, "id"),
      title: formString(formData, "title"),
      sortOrder: formInteger(formData, "sortOrder", 0),
      active: formData.get("active") === "on"
    });

    return `Saved ${concern.title}.`;
  });
}

export async function quickEditProductTypeAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runTaxonomyAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const productType = await updateProductType(context, actor, {
      id: formString(formData, "id"),
      title: formString(formData, "title"),
      sortOrder: formInteger(formData, "sortOrder", 0),
      active: formData.get("active") === "on"
    });

    return `Saved ${productType.title}.`;
  });
}

export async function quickEditRoutineAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return runTaxonomyAction(async () => {
    const context = requireCommerceContext();
    const actor = await getRequiredAdminActor();

    const routine = await updateRoutine(context, actor, {
      id: formString(formData, "id"),
      title: formString(formData, "title"),
      sortOrder: formInteger(formData, "sortOrder", 0),
      active: formData.get("active") === "on"
    });

    return `Saved ${routine.title}.`;
  });
}

async function runTaxonomyAction(operation: () => Promise<string>): Promise<AdminActionState> {
  try {
    const message = await operation();
    revalidatePath("/admin/taxonomy");
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
