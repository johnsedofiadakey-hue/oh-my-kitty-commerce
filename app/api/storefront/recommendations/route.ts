import { NextResponse } from "next/server";
import { getStorefrontCatalogue, toStorefrontProductViews } from "@/lib/storefront/catalogue";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Cart cross-sell: given the product ids already in the cart, returns a few
 * products that share a category with any of them, excluding anything
 * already in the cart. Read-only, no auth needed — same data every visitor
 * to the storefront can already see.
 */
export async function GET(request: Request) {
  if (!checkRateLimit(`storefront-recommendations:${getClientIp(request)}`, 30, 60_000)) {
    return NextResponse.json({ products: [] }, { status: 429 });
  }

  const url = new URL(request.url);
  const productIds = (url.searchParams.get("productIds") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (productIds.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const catalogue = await getStorefrontCatalogue();
  const products = toStorefrontProductViews(catalogue);
  const cartProductIds = new Set(productIds);

  const cartCategorySlugs = new Set(
    products.filter((product) => cartProductIds.has(product.id)).flatMap((product) => product.categorySlugs)
  );

  if (cartCategorySlugs.size === 0) {
    return NextResponse.json({ products: [] });
  }

  const seenProductIds = new Set<string>();
  const recommendations = products
    .filter((product) => {
      if (cartProductIds.has(product.id) || seenProductIds.has(product.id)) {
        return false;
      }
      if (!product.categorySlugs.some((slug) => cartCategorySlugs.has(slug))) {
        return false;
      }
      seenProductIds.add(product.id);
      return true;
    })
    .slice(0, 4)
    .map((product) => ({
      productId: product.id,
      variantId: product.variantId,
      title: product.title,
      variantTitle: product.variantTitle,
      sku: product.sku,
      unitPrice: product.price,
      formattedPrice: product.formattedPrice,
      imageUrl: product.imageUrl
    }));

  return NextResponse.json({ products: recommendations });
}
