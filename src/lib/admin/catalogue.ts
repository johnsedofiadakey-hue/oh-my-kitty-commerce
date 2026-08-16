import {
  adminData,
  formatMoney,
  getProductTitle,
  getVariantLabel
} from "@/lib/admin/sample-admin-data";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import type { Product, ProductVariant } from "@/lib/commerce/types";

export type AdminCatalogueSource = "live" | "sample";

export type AdminProductRow = {
  product: Product | null;
  variant: ProductVariant;
  lowStock: boolean;
};

export type AdminCatalogueData = {
  source: AdminCatalogueSource;
  sourceMessage?: string;
  products: Product[];
  variants: ProductVariant[];
  rows: AdminProductRow[];
  categories: typeof adminData.categories;
  collections: typeof adminData.collections;
};

export async function getAdminCatalogueData(): Promise<AdminCatalogueData> {
  const context = getCommerceServerContext();
  if (!context) {
    return sampleCatalogue("Firebase Admin is not configured yet. Showing sample catalogue.");
  }

  try {
    const products = await context.repo.listProducts();
    const variantGroups = await Promise.all(
      products.map((product) => context.repo.listVariants(product.id))
    );
    const variants = variantGroups.flat();
    return {
      source: "live",
      products,
      variants,
      rows: createRows(products, variants),
      categories: adminData.categories,
      collections: adminData.collections
    };
  } catch {
    return sampleCatalogue(
      "Firestore is not ready yet. Showing sample catalogue until Firebase is enabled."
    );
  }
}

export function formatAdminProductTitle(product: Product | null) {
  return getProductTitle(product);
}

export function formatAdminVariantLabel(variant: ProductVariant) {
  return getVariantLabel(variant);
}

export function formatAdminMoney(amount: number) {
  return formatMoney(amount);
}

function sampleCatalogue(sourceMessage: string): AdminCatalogueData {
  return {
    source: "sample",
    sourceMessage,
    products: adminData.products,
    variants: adminData.variants,
    rows: createRows(adminData.products, adminData.variants),
    categories: adminData.categories,
    collections: adminData.collections
  };
}

function createRows(products: Product[], variants: ProductVariant[]): AdminProductRow[] {
  return variants.map((variant) => {
    const product = products.find((entry) => entry.id === variant.productId) ?? null;
    const lowStock = variant.trackInventory && variant.stockAvailable <= variant.lowStockThreshold;

    return {
      product,
      variant,
      lowStock
    };
  });
}
