import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isShopClosed } from "@/lib/storefront/content";

/**
 * Site-wide kill switch: when the admin flips "Shop status" to Closed on
 * /admin/content, every storefront page redirects here instead of letting
 * a new order start. Admin, POS, the API, and order tracking are excluded
 * below on purpose — staff still need to work, and customers who already
 * ordered still need to check on it.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/closed") {
    return NextResponse.next();
  }

  if (!(await isShopClosed())) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/closed";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|admin|pos|track|fulfil|.*\\..*).*)"]
};
