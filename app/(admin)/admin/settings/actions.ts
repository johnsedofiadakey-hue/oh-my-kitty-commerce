"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import { updateStoreSettings } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { formOptionalString, formString } from "@/lib/admin/product-form";

export async function updateStoreSettingsAction(formData: FormData): Promise<void> {
  const context = getCommerceServerContext();
  if (!context) {
    throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
  }

  const actor = await getRequiredAdminActor();
  await updateStoreSettings(context, actor, {
    storeName: formString(formData, "storeName"),
    receiptFooter: formOptionalString(formData, "receiptFooter")
  });

  revalidatePath("/admin/settings");
}
