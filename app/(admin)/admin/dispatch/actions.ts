"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import {
  dispatchParcels,
  holdOrderPacking,
  markParcelDelivered,
  packOrder,
  returnParcel
} from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { formOptionalString, formString, type AdminActionState } from "@/lib/admin/product-form";

export async function packOrderAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return run(async () => {
    const context = requireContext();
    const actor = await getRequiredAdminActor();
    const parcel = await packOrder(context, actor, {
      orderId: formString(formData, "orderId"),
      reshipReason: formOptionalString(formData, "reshipReason")
    });

    return `Packed as ${parcel.parcelNumber}. Open Packed \u2192 Slip to print it, then pick from the slip.`;
  });
}

export async function holdOrderPackingAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return run(async () => {
    const context = requireContext();
    const actor = await getRequiredAdminActor();
    await holdOrderPacking(context, actor, {
      orderId: formString(formData, "orderId"),
      reason: formString(formData, "reason")
    });

    return "Held. The reason shows on the order so nobody retries it blindly.";
  });
}

export async function dispatchParcelsAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return run(async () => {
    const context = requireContext();
    const actor = await getRequiredAdminActor();
    const parcelIds = formData.getAll("parcelIds").map(String).filter(Boolean);
    if (parcelIds.length === 0) {
      throw new CommerceError("VALIDATION_ERROR", "Tick the parcels going out.");
    }

    const dispatched = await dispatchParcels(context, actor, {
      parcelIds,
      courier: formOptionalString(formData, "courier")
    });

    return `${dispatched.length} parcel${dispatched.length === 1 ? "" : "s"} on the way.`;
  });
}

export async function markParcelDeliveredAction(parcelId: string): Promise<AdminActionState> {
  return run(async () => {
    const context = requireContext();
    const actor = await getRequiredAdminActor();
    const parcel = await markParcelDelivered(context, actor, parcelId);
    return `${parcel.parcelNumber} marked delivered.`;
  });
}

export async function returnParcelAction(
  _previousState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return run(async () => {
    const context = requireContext();
    const actor = await getRequiredAdminActor();
    const parcel = await returnParcel(context, actor, {
      parcelId: formString(formData, "parcelId"),
      reason: formString(formData, "reason"),
      restock: formData.get("restock") !== "off"
    });

    return `${parcel.parcelNumber} recorded as returned, stock put back.`;
  });
}

function requireContext() {
  const context = getCommerceServerContext();
  if (!context) {
    throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
  }

  return context;
}

async function run(work: () => Promise<string>): Promise<AdminActionState> {
  try {
    const message = await work();
    revalidatePath("/admin/dispatch");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/inventory");
    return { status: "success", message };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof CommerceError || error instanceof Error ? error.message : "Something went wrong."
    };
  }
}
