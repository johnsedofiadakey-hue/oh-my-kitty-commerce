import { NextResponse } from "next/server";
import { getStorefrontDeliveryOptions } from "@/lib/storefront/delivery";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Read-only, no auth needed — same delivery fee/free-threshold data every
 * visitor already sees on /checkout and /delivery. The cart drawer fetches
 * this client-side to drive the "add GHS X more for free delivery" bar.
 */
export async function GET(request: Request) {
  if (!checkRateLimit(`storefront-delivery-options:${getClientIp(request)}`, 30, 60_000)) {
    return NextResponse.json({ options: [] }, { status: 429 });
  }

  const options = await getStorefrontDeliveryOptions();
  return NextResponse.json({ options });
}
