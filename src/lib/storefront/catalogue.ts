import { getCommerceServerContext } from "@/lib/commerce/server-context";
import {
  sampleMedia,
  sampleProducts,
  sampleVariants
} from "@/lib/commerce/sample-data";
import type { MediaAsset, Product, ProductVariant } from "@/lib/commerce/types";
import { formatMoney } from "@/lib/commerce/format";

export type StorefrontCatalogueSource = "live" | "sample";

export type StorefrontProductCard = {
  product: Product;
  variant: ProductVariant;
  media: MediaAsset | null;
};

export type StorefrontCatalogue = {
  source: StorefrontCatalogueSource;
  sourceMessage?: string;
  cards: StorefrontProductCard[];
};

export type StorefrontProductView = {
  id: string;
  title: string;
  shortCopy: string;
  variantId: string;
  variantTitle: string;
  sku: string;
  price: number;
  formattedPrice: string;
  stockAvailable: number;
  imageUrl?: string;
  imageAlt?: string;
  tone: "peach" | "green" | "ivory";
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

    const media = await context.repo.listMedia();
    const cards = createCards(products, variants, media);
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
      sampleMedia.filter((media) => media.visibility === "PUBLIC")
    )
  };
}

function createCards(products: Product[], variants: ProductVariant[], media: MediaAsset[]) {
  const mediaById = new Map(media.map((asset) => [asset.id, asset]));

  return variants
    .map((variant) => {
      const product = products.find((entry) => entry.id === variant.productId);
      const mediaId = variant.mediaIds[0] ?? product?.mediaIds[0];
      return product
        ? { product, variant, media: mediaId ? (mediaById.get(mediaId) ?? null) : null }
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

  return catalogue.cards.map(({ product, variant, media }, index) => ({
    id: product.id,
    title: product.title,
    shortCopy: product.shortCopy ?? "Soft daily care.",
    variantId: variant.id,
    variantTitle: variant.title,
    sku: variant.sku,
    price: variant.price,
    formattedPrice: formatStorefrontMoney(variant.price),
    stockAvailable: variant.stockAvailable,
    imageUrl: media?.url,
    imageAlt: media?.alt,
    tone: tones[index % tones.length] ?? "peach"
  }));
}
