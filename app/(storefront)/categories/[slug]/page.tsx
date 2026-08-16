import { notFound } from "next/navigation";
import { DepthShop } from "@/components/storefront/depth-shop";
import {
  getStorefrontCatalogue,
  toStorefrontProductViews
} from "@/lib/storefront/catalogue";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalogue = await getStorefrontCatalogue();
  const products = toStorefrontProductViews(catalogue);
  const categoryTitle =
    products
      .flatMap((product) =>
        product.categorySlugs.map((categorySlug, index) => ({
          slug: categorySlug,
          title: product.categoryLabels[index] ?? categorySlug
        }))
      )
      .find((category) => category.slug === slug)?.title ?? null;

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
