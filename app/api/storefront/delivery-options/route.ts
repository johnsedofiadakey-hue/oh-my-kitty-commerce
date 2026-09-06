import { NextResponse } from "next/server";
import { getStorefrontDeliveryOptions } from "@/lib/storefront/delivery";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Read-only, no auth needed — same delivery fee/free-threshold data every
 * visitor already sees on /checkout and /delivery. The cart drawer fetches
 * this client-side (no `productIds`) to drive the "add GHS X more for free
 * delivery" bar — without `productIds`, any rule gated behind a
 * free-delivery-tagged item is treated as ineligible and left out, same as
 * an empty cart would be. The checkout page passes `productIds` so a gated
 * rule shows up once the cart actually has a qualifying item in it.
 */
export async function GET(request: Request) {
  if (!checkRateLimit(`storefront-delivery-options:${getClientIp(request)}`, 30, 60_000)) {
    return NextResponse.json({ options: [] }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const productIdsParam = searchParams.get("productIds");
  const productIds = productIdsParam
    ? productIdsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : undefined;

  const options = await getStorefrontDeliveryOptions(productIds);
  return NextResponse.json({ options });
}
