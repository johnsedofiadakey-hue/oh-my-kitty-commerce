import {
  adminData,
  formatMoney,
  getProductTitle,
  getVariantLabel
} from "@/lib/admin/sample-admin-data";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { computeAvailableStock, isSetVariant } from "@/lib/commerce/inventory";
import type {
  Collection,
  Concern,
  MediaAsset,
  Product,
  ProductType,
  ProductVariant,
  RawMaterial,
  Routine
} from "@/lib/commerce/types";

export type AdminCatalogueSource = "live" | "sample";

export type AdminProductRow = {
  product: Product | null;
  variant: ProductVariant;
  isSet: boolean;
  availableStock: number;
  lowStock: boolean;
};

export type AdminCatalogueData = {
  source: AdminCatalogueSource;
  sourceMessage?: string;
  products: Product[];
  variants: ProductVariant[];
  rows: AdminProductRow[];
  collections: Collection[];
  concerns: Concern[];
  productTypes: ProductType[];
  routines: Routine[];
  media: MediaAsset[];
  rawMaterials: RawMaterial[];
};

export async function getAdminCatalogueData(): Promise<AdminCatalogueData> {
  const context = getCommerceServerContext();
  if (!context) {
    return sampleCatalogue("Firebase Admin is not configured yet. Showing sample catalogue.");
  }

  try {
    const products = await context.repo.listProducts();
    const variants = await context.repo.listAllVariants();
    const [collections, concerns, productTypes, routines, media, rawMaterials] = await Promise.all([
      context.repo.listCollections(),
      context.repo.listConcerns(),
      context.repo.listProductTypes(),
      context.repo.listRoutines(),
      context.repo.listMedia(),
      context.repo.listRawMaterials()
    ]);
    return {
      source: "live",
      products,
      variants,
      rows: createRows(products, variants),
      collections,
      concerns,
      productTypes,
      routines,
      media,
      rawMaterials
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
    collections: adminData.collections,
    concerns: adminData.concerns,
    productTypes: adminData.productTypes,
    routines: adminData.routines,
    media: adminData.media,
    rawMaterials: []
  };
}

function createRows(products: Product[], variants: ProductVariant[]): AdminProductRow[] {
  const variantsById = new Map(variants.map((variant) => [variant.id, variant]));

  return variants.map((variant) => {
    const product = products.find((entry) => entry.id === variant.productId) ?? null;
    const isSet = isSetVariant(variant);
    const availableStock = computeAvailableStock(variant, variantsById);
    const lowStock = isSet
      ? availableStock <= variant.lowStockThreshold
      : variant.trackInventory && variant.stockAvailable <= variant.lowStockThreshold;

    return {
      product,
      variant,
      isSet,
      availableStock,
      lowStock
    };
  });
}
