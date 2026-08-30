import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isShopClosed } from "@/lib/storefront/content";
import { publicEnv } from "@/lib/env/public";
import { isProductionAppEnv } from "@/lib/env/server";

/**
 * Site-wide kill switch: when the admin flips "Shop status" to Closed on
 * /admin/content, every storefront page redirects here instead of letting
 * a new order start. Admin, POS, the API, and order tracking are excluded
 * below on purpose — staff still need to work, and customers who already
 * ordered still need to check on it.
 */
export async function proxy(request: NextRequest) {
  const canonicalRedirect = getCanonicalHostRedirect(request);
  if (canonicalRedirect) {
    return canonicalRedirect;
  }

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

// The storefront is reachable on three hosts in production — the custom
// domain, Firebase Hosting's default *.web.app subdomain, and the raw Cloud
// Run URL — but only the custom domain should ever be indexed. Redirecting
// here (rather than in firebase.json) is what lets this apply uniformly
// across all three, since Firebase Hosting rewrites can't distinguish which
// hostname a request arrived on. Scoped to this proxy's existing matcher,
// so it never touches /api and can't interfere with the Paystack webhook.
function getCanonicalHostRedirect(request: NextRequest) {
  if (!isProductionAppEnv()) {
    return null;
  }

  const canonicalOrigin = getCanonicalOrigin();
  const requestHost = request.headers.get("host");

  if (!canonicalOrigin || !requestHost || requestHost === new URL(canonicalOrigin).host) {
    return null;
  }

  // Built from a fresh URL rather than mutating request.nextUrl.clone() —
  // NextURL's .host setter doesn't reliably drop a port the original
  // request carried, which leaked the dev port into the redirect target.
  const target = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, canonicalOrigin);
  return NextResponse.redirect(target, 308);
}

function getCanonicalOrigin() {
  if (!publicEnv.NEXT_PUBLIC_SITE_URL) {
    return null;
  }

  try {
    return new URL(publicEnv.NEXT_PUBLIC_SITE_URL).origin;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|admin|pos|track|fulfil|.*\\..*).*)"]
};
