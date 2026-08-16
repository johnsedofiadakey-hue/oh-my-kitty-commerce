import type { Category, Product, ProductVariant } from "@/lib/commerce/types";

export const sampleCategories: Category[] = [
  {
    id: "cat-intimate-care",
    title: "Intimate Care",
    slug: "intimate-care",
    sortOrder: 1,
    active: true
  },
  {
    id: "cat-wellness",
    title: "Wellness",
    slug: "wellness",
    sortOrder: 2,
    active: true
  }
];

export const sampleProducts: Product[] = [
  {
    id: "product-intimate-oil",
    title: "OMK Intimate Oil",
    slug: "omk-intimate-oil",
    shortCopy: "Soft daily care.",
    status: "ACTIVE",
    categoryIds: ["cat-intimate-care"],
    collectionIds: ["collection-hero"],
    tags: ["hero"],
    mediaIds: [],
    featured: true,
    homepagePriority: 1
  },
  {
    id: "product-slippery-elm",
    title: "Slippery Elm",
    slug: "slippery-elm",
    shortCopy: "Botanical wellness.",
    status: "ACTIVE",
    categoryIds: ["cat-wellness"],
    collectionIds: ["collection-hero"],
    tags: ["botanical"],
    mediaIds: [],
    featured: true,
    homepagePriority: 2
  }
];

export const sampleVariants: ProductVariant[] = [
  {
    id: "variant-intimate-oil-default",
    productId: "product-intimate-oil",
    title: "Default",
    sku: "OMK-OIL-DEFAULT",
    optionValues: { format: "Oil" },
    price: 0,
    currency: "GHS",
    mediaIds: [],
    trackInventory: true,
    stockOnHand: 0,
    stockAvailable: 0,
    lowStockThreshold: 5,
    active: true
  },
  {
    id: "variant-slippery-elm-30",
    productId: "product-slippery-elm",
    title: "30 Capsules",
    sku: "OMK-SE-30",
    optionValues: { size: "30 Capsules" },
    price: 0,
    currency: "GHS",
    mediaIds: [],
    trackInventory: true,
    stockOnHand: 0,
    stockAvailable: 0,
    lowStockThreshold: 5,
    active: true
  }
];
