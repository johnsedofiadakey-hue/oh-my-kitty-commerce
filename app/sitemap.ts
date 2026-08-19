import type { MetadataRoute } from "next";
import {
  getStorefrontCatalogue,
  toStorefrontCategorySummaries,
  toStorefrontProductViews
} from "@/lib/storefront/catalogue";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ohmyk1tty.web.app";
  const catalogue = await getStorefrontCatalogue();
  const products = toStorefrontProductViews(catalogue);
  const categories = toStorefrontCategorySummaries(catalogue);

  const staticPaths = ["", "/shop", "/faq", "/delivery", "/contact", "/returns", "/privacy", "/terms"];
  const productSlugs = [...new Set(products.map((product) => product.slug))];
  const categorySlugs = [...new Set(categories.map((category) => category.slug))];
  const lastModified = new Date();

  return [
    ...staticPaths.map((path) => ({ url: `${siteUrl}${path}`, lastModified })),
    ...productSlugs.map((slug) => ({ url: `${siteUrl}/products/${slug}`, lastModified })),
    ...categorySlugs.map((slug) => ({ url: `${siteUrl}/categories/${slug}`, lastModified }))
  ];
}
