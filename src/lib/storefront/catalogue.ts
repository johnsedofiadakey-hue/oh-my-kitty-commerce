import { getCommerceServerContext } from "@/lib/commerce/server-context";
import {
  sampleCategories,
  sampleMedia,
  sampleProducts,
  sampleVariants
} from "@/lib/commerce/sample-data";
import type { Category, MediaAsset, Product, ProductVariant } from "@/lib/commerce/types";
import { formatMoney } from "@/lib/commerce/format";

export type StorefrontCatalogueSource = "live" | "sample";

export type StorefrontProductCard = {
  product: Product;
  variant: ProductVariant;
  media: MediaAsset | null;
  categories: Category[];
};

export type StorefrontCatalogue = {
  source: StorefrontCatalogueSource;
  sourceMessage?: string;
  cards: StorefrontProductCard[];
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
  stockAvailable: number;
  imageUrl?: string;
  imageAlt?: string;
  primaryCategory: string;
  primaryCategorySlug: string;
  categoryLabels: string[];
  categorySlugs: string[];
  care?: StorefrontProductCare;
  tone: "peach" | "green" | "ivory";
};

export type StorefrontProductCare = {
  usage?: string;
  ingredients?: string;
  warnings?: string;
};

export async function getStorefrontCatalogue(): Promise<StorefrontCatalogue> {
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

    const [media, categories] = await Promise.all([
      context.repo.listMedia(),
      context.repo.listCategories()
    ]);
    const cards = createCards(products, variants, media, categories);
    if (cards.length === 0) {
      return sampleStorefrontCatalogue(
        "No live products are published yet. Showing starter catalogue."
      );
    }

    return {
      source: "live",
      cards
    };
  } catch {
    return sampleStorefrontCatalogue("Firestore is not ready yet. Showing starter catalogue.");
  }
}

function sampleStorefrontCatalogue(sourceMessage: string): StorefrontCatalogue {
  return {
    source: "sample",
    sourceMessage,
    cards: createCards(
      sampleProducts.filter((product) => product.status === "ACTIVE"),
      sampleVariants.filter((variant) => variant.active),
      sampleMedia.filter((media) => media.visibility === "PUBLIC"),
      sampleCategories.filter((category) => category.active)
    )
  };
}

function createCards(
  products: Product[],
  variants: ProductVariant[],
  media: MediaAsset[],
  categories: Category[]
) {
  const mediaById = new Map(media.map((asset) => [asset.id, asset]));
  const categoriesById = new Map(categories.map((category) => [category.id, category]));

  return variants
    .map((variant) => {
      const product = products.find((entry) => entry.id === variant.productId);
      const mediaId = variant.mediaIds[0] ?? product?.mediaIds[0];
      return product
        ? {
            product,
            variant,
            media: mediaId ? (mediaById.get(mediaId) ?? null) : null,
            categories: product.categoryIds
              .map((categoryId) => categoriesById.get(categoryId))
              .filter((category): category is Category => category !== undefined)
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

  return catalogue.cards.map(({ product, variant, media, categories }, index) => ({
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
    stockAvailable: variant.stockAvailable,
    imageUrl: media?.url,
    imageAlt: media?.alt,
    primaryCategory: categories[0]?.title ?? "Care",
    primaryCategorySlug: categories[0]?.slug ?? "care",
    categoryLabels: categories.map((category) => category.title),
    categorySlugs: categories.map((category) => category.slug),
    care: product.care,
    tone: tones[index % tones.length] ?? "peach"
  }));
}
