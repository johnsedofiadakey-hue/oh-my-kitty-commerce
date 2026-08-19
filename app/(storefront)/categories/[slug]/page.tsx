import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DepthShop } from "@/components/storefront/depth-shop";
import {
  getStorefrontCatalogue,
  toStorefrontProductViews
} from "@/lib/storefront/catalogue";

export const dynamic = "force-dynamic";

type CategoryPageParams = { params: Promise<{ slug: string }> };

async function resolveCategoryTitle(slug: string) {
  const catalogue = await getStorefrontCatalogue();
  const products = toStorefrontProductViews(catalogue);

  return (
    products
      .flatMap((product) =>
        product.categorySlugs.map((categorySlug, index) => ({
          slug: categorySlug,
          title: product.categoryLabels[index] ?? categorySlug
        }))
      )
      .find((category) => category.slug === slug)?.title ?? null
  );
}

export async function generateMetadata({ params }: CategoryPageParams): Promise<Metadata> {
  const { slug } = await params;
  const categoryTitle = await resolveCategoryTitle(slug);

  if (!categoryTitle) {
    return { title: "Category not found" };
  }

  return {
    title: categoryTitle,
    description: `Shop ${categoryTitle} at Oh My Kitty — mobile-first intimate care, pickup or delivery.`,
    alternates: { canonical: `/categories/${slug}` }
  };
}

export default async function CategoryPage({ params }: CategoryPageParams) {
  const { slug } = await params;
  const catalogue = await getStorefrontCatalogue();
  const products = toStorefrontProductViews(catalogue);
  const categoryTitle = await resolveCategoryTitle(slug);

  if (!categoryTitle) {
    notFound();
  }

  const categoryProducts = products.filter((product) => product.categorySlugs.includes(slug));

  return (
    <DepthShop
      products={categoryProducts}
      sourceMessage={`${categoryTitle} products from the live Oh My Kitty catalogue.`}
    />
  );
}
