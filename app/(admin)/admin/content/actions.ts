"use server";

import { revalidatePath } from "next/cache";
import { CommerceError } from "@/lib/commerce/errors";
import { updateContentBlock } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { formString } from "@/lib/admin/product-form";

export async function updateContentBlockAction(formData: FormData): Promise<void> {
  const context = requireCommerceContext();
  const actor = await getRequiredAdminActor();

  await updateContentBlock(context, actor, {
    key: formString(formData, "key"),
    value: formString(formData, "value")
  });

  revalidatePath("/admin/content");
  revalidatePath("/contact");
  revalidatePath("/delivery");
  revalidatePath("/faq");
  revalidatePath("/returns");
}

function requireCommerceContext() {
  const context = getCommerceServerContext();
  if (!context) {
    throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
  }

  return context;
}
