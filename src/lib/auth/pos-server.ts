import { getRequiredAdminActor } from "@/lib/auth/server";
import type { CommerceActor } from "@/lib/commerce/operations";
import { isProductionAppEnv } from "@/lib/env/server";

export async function getRequiredPosActor(): Promise<CommerceActor> {
  try {
    return await getRequiredAdminActor();
  } catch (error) {
    if (isProductionAppEnv()) {
      throw error;
    }

    return {
      uid: "local-pos-staff",
      roleIds: ["role-sales-staff"]
    };
  }
}
