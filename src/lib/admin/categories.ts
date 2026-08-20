import { adminData } from "@/lib/admin/sample-admin-data";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import type { Category, MediaAsset } from "@/lib/commerce/types";

export type AdminCategoriesSource = "live" | "sample";

export type AdminCategoriesData = {
  source: AdminCategoriesSource;
  sourceMessage?: string;
  categories: Category[];
  media: MediaAsset[];
};

export async function getAdminCategoriesData(): Promise<AdminCategoriesData> {
  const context = getCommerceServerContext();
  if (!context) {
    return sampleCategoriesData("Firebase Admin is not configured yet. Showing sample categories.");
  }

  try {
    const [categories, media] = await Promise.all([context.repo.listCategories(), context.repo.listMedia()]);

    return { source: "live", categories, media };
  } catch {
    return sampleCategoriesData("Firestore is not ready yet. Showing sample categories.");
  }
}

function sampleCategoriesData(sourceMessage: string): AdminCategoriesData {
  return {
    source: "sample",
    sourceMessage,
    categories: adminData.categories,
    media: adminData.media
  };
}
