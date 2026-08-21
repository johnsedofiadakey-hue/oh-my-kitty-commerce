import { cache } from "react";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import {
  sampleCategories,
  sampleConcerns,
  sampleMedia,
  sampleProducts,
  sampleProductTypes,
  sampleRoutines,
  sampleVariants
} from "@/lib/commerce/sample-data";
import type {
  Category,
  Concern,
  MediaAsset,
  Product,
  ProductType,
  ProductVariant,
  Routine
} from "@/lib/commerce/types";
import { formatMoney } from "@/lib/commerce/format";

export type StorefrontCatalogueSource = "live" | "sample";

export type StorefrontProductCard = {
  product: Product;
  variant: ProductVariant;
  media: MediaAsset | null;
  categories: Category[];
  concerns: Concern[];
  productTypes: ProductType[];
  routines: Routine[];
};

export type StorefrontCatalogue = {
  source: StorefrontCatalogueSource;
  sourceMessage?: string;
  cards: StorefrontProductCard[];
  media: MediaAsset[];
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
  primaryCategory: string;
  primaryCategorySlug: string;
  categoryLabels: string[];
  categorySlugs: string[];
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

export type StorefrontCategorySummary = {
  id: string;
  title: string;
  slug: string;
  productCount: number;
  imageUrl?: string;
  tone: StorefrontProductView["tone"];
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
    const variants = (
      await Promise.all(products.map((product) => context.repo.listVariants(product.id)))
    )
      .flat()
      .filter((variant) => variant.active);

    const [media, categories, concerns, productTypes, routines] = await Promise.all([
      context.repo.listMedia(),
      context.repo.listCategories(),
      context.repo.listConcerns(),
      context.repo.listProductTypes(),
      context.repo.listRoutines()
    ]);
    const cards = createCards(products, variants, media, categories, concerns, productTypes, routines);
    if (cards.length === 0) {
      return sampleStorefrontCatalogue(
        "No live products are published yet. Showing starter catalogue."
      );
    }

    return {
      source: "live",
      cards,
      media
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
      sampleCategories.filter((category) => category.active),
      sampleConcerns.filter((concern) => concern.active),
      sampleProductTypes.filter((productType) => productType.active),
      sampleRoutines.filter((routine) => routine.active)
    ),
    media
  };
}

function createCards(
  products: Product[],
  variants: ProductVariant[],
  media: MediaAsset[],
  categories: Category[],
  concerns: Concern[],
  productTypes: ProductType[],
  routines: Routine[]
) {
  const mediaById = new Map(media.map((asset) => [asset.id, asset]));
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
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
            categories: (product.categoryIds ?? [])
              .map((categoryId) => categoriesById.get(categoryId))
              .filter((category): category is Category => category !== undefined),
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
    ({ product, variant, media, categories, concerns, productTypes, routines }, index) => ({
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
      stockAvailable: variant.stockAvailable,
      imageUrl: media?.url,
      imageAlt: media?.alt,
      primaryCategory: categories[0]?.title ?? "Care",
      primaryCategorySlug: categories[0]?.slug ?? "care",
      categoryLabels: categories.map((category) => category.title),
      categorySlugs: categories.map((category) => category.slug),
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

export function toStorefrontCategorySummaries(
  catalogue: StorefrontCatalogue
): StorefrontCategorySummary[] {
  const tones: StorefrontProductView["tone"][] = ["peach", "green", "ivory"];
  const mediaById = new Map(catalogue.media.map((asset) => [asset.id, asset]));
  const bySlug = new Map<string, { category: Category; productCount: number; imageUrl?: string }>();

  for (const card of catalogue.cards) {
    for (const category of card.categories) {
      // A category's own uploaded photo (set on the Categories admin page)
      // always wins — falling back to a product's photo only when the
      // category itself has none, so the tile isn't blank.
      const categoryImageUrl = category.mediaId ? mediaById.get(category.mediaId)?.url : undefined;

      const existing = bySlug.get(category.slug);
      if (existing) {
        existing.productCount += 1;
        if (!existing.imageUrl && (categoryImageUrl ?? card.media?.url)) {
          existing.imageUrl = categoryImageUrl ?? card.media?.url;
        }
      } else {
        bySlug.set(category.slug, {
          category,
          productCount: 1,
          imageUrl: categoryImageUrl ?? card.media?.url
        });
      }
    }
  }

  return Array.from(bySlug.values())
    .sort((first, second) => first.category.sortOrder - second.category.sortOrder)
    .map((entry, index) => ({
      id: entry.category.id,
      title: entry.category.title,
      slug: entry.category.slug,
      productCount: entry.productCount,
      imageUrl: entry.imageUrl,
      tone: tones[index % tones.length] ?? "peach"
    }));
}
