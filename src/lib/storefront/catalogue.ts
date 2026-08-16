import { getCommerceServerContext } from "@/lib/commerce/server-context";
import {
  sampleProducts,
  sampleVariants
} from "@/lib/commerce/sample-data";
import type { Product, ProductVariant } from "@/lib/commerce/types";
import { formatMoney } from "@/lib/commerce/format";

export type StorefrontCatalogueSource = "live" | "sample";

export type StorefrontProductCard = {
  product: Product;
  variant: ProductVariant;
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

    const cards = createCards(products, variants);
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
      sampleVariants.filter((variant) => variant.active)
    )
  };
}

function createCards(products: Product[], variants: ProductVariant[]) {
  return variants
    .map((variant) => {
      const product = products.find((entry) => entry.id === variant.productId);
      return product ? { product, variant } : null;
    })
    .filter((entry): entry is StorefrontProductCard => entry !== null);
}

export function formatStorefrontMoney(amount: number) {
  return formatMoney(amount);
}

export function toStorefrontProductViews(catalogue: StorefrontCatalogue): StorefrontProductView[] {
  const tones: StorefrontProductView["tone"][] = ["peach", "green", "ivory"];

  return catalogue.cards.map(({ product, variant }, index) => ({
    id: product.id,
    title: product.title,
    shortCopy: product.shortCopy ?? "Soft daily care.",
    variantId: variant.id,
    variantTitle: variant.title,
    sku: variant.sku,
    price: variant.price,
    formattedPrice: formatStorefrontMoney(variant.price),
    stockAvailable: variant.stockAvailable,
    tone: tones[index % tones.length] ?? "peach"
  }));
}
