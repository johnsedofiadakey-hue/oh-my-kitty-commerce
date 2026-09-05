import { cache } from "react";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import {
  sampleConcerns,
  sampleMedia,
  sampleProducts,
  sampleProductTypes,
  sampleRoutines,
  sampleVariants
} from "@/lib/commerce/sample-data";
import type {
  Concern,
  MediaAsset,
  Product,
  ProductType,
  ProductVariant,
  Routine
} from "@/lib/commerce/types";
import { formatMoney } from "@/lib/commerce/format";
import { computeAvailableStock } from "@/lib/commerce/inventory";

export type StorefrontCatalogueSource = "live" | "sample";

export type StorefrontProductCard = {
  product: Product;
  variant: ProductVariant;
  media: MediaAsset | null;
  concerns: Concern[];
  productTypes: ProductType[];
  routines: Routine[];
};

export type StorefrontCatalogue = {
  source: StorefrontCatalogueSource;
  sourceMessage?: string;
  cards: StorefrontProductCard[];
  media: MediaAsset[];
  // Every variant, not just cards' own — needed to resolve a set's
  // components (which can belong to a different product) when computing
  // how many of it are actually available to sell.
  variantsById: Map<string, ProductVariant>;
};

export type StorefrontProductView = {
  id: string;
  slug: string;
  title: string;
  shortCopy: string;
  description?: string;
  variantId: string;
  variantTitle: string;
  sku: string;
  price: number;
  formattedPrice: string;
  compareAtPrice?: number;
  formattedCompareAtPrice?: string;
  stockAvailable: number;
  imageUrl?: string;
  imageAlt?: string;
  concernLabels: string[];
  concernSlugs: string[];
  productTypeLabels: string[];
  productTypeSlugs: string[];
  routineLabels: string[];
  routineSlugs: string[];
  tags: string[];
  bestSeller: boolean;
  care?: StorefrontProductCare;
  tone: "peach" | "green" | "ivory";
};

export type StorefrontProductCare = {
  usage?: string;
  ingredients?: string;
  warnings?: string;
};

/**
 * Cached per-request: product pages call this from both generateMetadata
 * and the page body — without `cache()` that's a duplicate Firestore fetch
 * on every single product page load.
 */
export const getStorefrontCatalogue = cache(async (): Promise<StorefrontCatalogue> => {
  const context = getCommerceServerContext();
  if (!context) {
    return sampleStorefrontCatalogue("Firebase is not configured yet. Showing starter catalogue.");
  }

  try {
    const products = (await context.repo.listProducts()).filter(
      (product) => product.status === "ACTIVE"
    );
    const productIds = new Set(products.map((product) => product.id));
    const allVariants = await context.repo.listAllVariants();
    const variantsById = new Map(allVariants.map((variant) => [variant.id, variant]));
    const variants = allVariants.filter((variant) => variant.active && productIds.has(variant.productId));

    // Every storefront page load used to list the entire media library just
    // to look up the handful of images these products actually reference —
    // fetch only those instead. Mirrors exactly what createCards resolves
    // per card (variant's own image, falling back to the product's).
    const neededMediaIds = new Set<string>();
    for (const variant of variants) {
      const id = (variant.mediaIds ?? [])[0];
      if (id) {
        neededMediaIds.add(id);
      }
    }
    for (const product of products) {
      const id = (product.mediaIds ?? [])[0];
      if (id) {
        neededMediaIds.add(id);
      }
    }

    const [media, concerns, productTypes, routines] = await Promise.all([
      context.repo.findMediaByIds([...neededMediaIds]),
      context.repo.listConcerns(),
      context.repo.listProductTypes(),
      context.repo.listRoutines()
    ]);
    const cards = createCards(products, variants, media, concerns, productTypes, routines);
    if (cards.length === 0) {
      // Genuinely live and working, just nothing published yet (e.g. mid
      // re-upload after a catalogue clear-out) — show that honestly rather
      // than falling back to the sample catalogue, which shares real
      // product names and would read as leftover/undeleted inventory.
      return {
        source: "live",
        sourceMessage: "We're restocking — new products are on their way.",
        cards: [],
        media,
        variantsById
      };
    }

    return {
      source: "live",
      cards,
      media,
      variantsById
    };
  } catch {
    return sampleStorefrontCatalogue("Firestore is not ready yet. Showing starter catalogue.");
  }
});

function sampleStorefrontCatalogue(sourceMessage: string): StorefrontCatalogue {
  const media = sampleMedia.filter((asset) => asset.visibility === "PUBLIC");
  return {
    source: "sample",
    sourceMessage,
    cards: createCards(
      sampleProducts.filter((product) => product.status === "ACTIVE"),
      sampleVariants.filter((variant) => variant.active),
      media,
      sampleConcerns.filter((concern) => concern.active),
      sampleProductTypes.filter((productType) => productType.active),
      sampleRoutines.filter((routine) => routine.active)
    ),
    media,
    variantsById: new Map(sampleVariants.map((variant) => [variant.id, variant]))
  };
}

function createCards(
  products: Product[],
  variants: ProductVariant[],
  media: MediaAsset[],
  concerns: Concern[],
  productTypes: ProductType[],
  routines: Routine[]
) {
  const mediaById = new Map(media.map((asset) => [asset.id, asset]));
  const concernsById = new Map(concerns.map((concern) => [concern.id, concern]));
  const productTypesById = new Map(productTypes.map((productType) => [productType.id, productType]));
  const routinesById = new Map(routines.map((routine) => [routine.id, routine]));

  return variants
    .map((variant) => {
      const product = products.find((entry) => entry.id === variant.productId);
      // Firestore doesn't enforce the Product/ProductVariant types — documents
      // written before a field existed (or via a path that skipped it) can be
      // missing these arrays entirely at runtime, so every access here is
      // defensive rather than trusting the TS type.
      const mediaId = (variant.mediaIds ?? [])[0] ?? (product?.mediaIds ?? [])[0];
      return product
        ? {
            product,
            variant,
            media: mediaId ? (mediaById.get(mediaId) ?? null) : null,
            concerns: (product.concernIds ?? [])
              .map((concernId) => concernsById.get(concernId))
              .filter((concern): concern is Concern => concern !== undefined),
            productTypes: (product.productTypeIds ?? [])
              .map((productTypeId) => productTypesById.get(productTypeId))
              .filter((productType): productType is ProductType => productType !== undefined),
            routines: (product.routineIds ?? [])
              .map((routineId) => routinesById.get(routineId))
              .filter((routine): routine is Routine => routine !== undefined)
          }
        : null;
    })
    .filter((entry): entry is StorefrontProductCard => entry !== null)
    .sort((first, second) => {
      const priorityDelta =
        (first.product.homepagePriority ?? Number.MAX_SAFE_INTEGER) -
        (second.product.homepagePriority ?? Number.MAX_SAFE_INTEGER);

      return priorityDelta || first.product.title.localeCompare(second.product.title);
    });
}

export function formatStorefrontMoney(amount: number) {
  return formatMoney(amount);
}

export function toStorefrontProductViews(catalogue: StorefrontCatalogue): StorefrontProductView[] {
  const tones: StorefrontProductView["tone"][] = ["peach", "green", "ivory"];

  return catalogue.cards.map(
    ({ product, variant, media, concerns, productTypes, routines }, index) => ({
      id: product.id,
      slug: product.slug,
      title: product.title,
      shortCopy: product.shortCopy ?? "Soft daily care.",
      description: product.description,
      variantId: variant.id,
      variantTitle: variant.title,
      sku: variant.sku,
      price: variant.price,
      formattedPrice: formatStorefrontMoney(variant.price),
      // Only a real "was" price if it's actually higher than the current
      // price — otherwise there's no discount to show, so treat it as unset
      // rather than displaying a confusing or backwards strikethrough.
      compareAtPrice:
        variant.compareAtPrice && variant.compareAtPrice > variant.price ? variant.compareAtPrice : undefined,
      formattedCompareAtPrice:
        variant.compareAtPrice && variant.compareAtPrice > variant.price
          ? formatStorefrontMoney(variant.compareAtPrice)
          : undefined,
      stockAvailable: computeAvailableStock(variant, catalogue.variantsById),
      imageUrl: media?.url,
      imageAlt: media?.alt,
      concernLabels: concerns.map((concern) => concern.title),
      concernSlugs: concerns.map((concern) => concern.slug),
      productTypeLabels: productTypes.map((productType) => productType.title),
      productTypeSlugs: productTypes.map((productType) => productType.slug),
      routineLabels: routines.map((routine) => routine.title),
      routineSlugs: routines.map((routine) => routine.slug),
      tags: product.tags ?? [],
      bestSeller: product.bestSeller,
      care: product.care,
      tone: tones[index % tones.length] ?? "peach"
    })
  );
}

