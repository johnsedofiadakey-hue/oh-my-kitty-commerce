import { adminData } from "@/lib/admin/sample-admin-data";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import type { Concern, ProductType, Routine } from "@/lib/commerce/types";

export type AdminTaxonomySource = "live" | "sample";

export type AdminTaxonomyData = {
  source: AdminTaxonomySource;
  sourceMessage?: string;
  concerns: Concern[];
  productTypes: ProductType[];
  routines: Routine[];
};

export async function getAdminTaxonomyData(): Promise<AdminTaxonomyData> {
  const context = getCommerceServerContext();
  if (!context) {
    return sampleTaxonomy("Firebase Admin is not configured yet. Showing sample taxonomy.");
  }

  try {
    const [concerns, productTypes, routines] = await Promise.all([
      context.repo.listConcerns(),
      context.repo.listProductTypes(),
      context.repo.listRoutines()
    ]);

    return { source: "live", concerns, productTypes, routines };
  } catch {
    return sampleTaxonomy("Firestore is not ready yet. Showing sample taxonomy.");
  }
}

function sampleTaxonomy(sourceMessage: string): AdminTaxonomyData {
  return {
    source: "sample",
    sourceMessage,
    concerns: adminData.concerns,
    productTypes: adminData.productTypes,
    routines: adminData.routines
  };
}
