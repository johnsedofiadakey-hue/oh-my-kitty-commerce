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
//
// This is deliberately an allowlist of known duplicate hosts, not an
// "isn't the canonical host" check — Firebase Hosting's rewrite to Cloud
// Run replaces the Host header with Cloud Run's own internal hostname, so
// a naive not-canonical check redirect-looped the live canonical domain
// the first time this shipped. Matching only known alternates means an
// unrecognized host (including whatever internal host Firebase Hosting
// substitutes) is left alone instead of risking that again.
const KNOWN_ALTERNATE_HOSTS: (string | RegExp)[] = [
  "ohmyk1tty.web.app",
  /^oh-my-kitty-[a-z0-9]+(-[a-z0-9]+)?\.[a-z0-9-]+\.run\.app$/
];

function getCanonicalHostRedirect(request: NextRequest) {
  if (!isProductionAppEnv()) {
    return null;
  }

  const canonicalOrigin = getCanonicalOrigin();
  const requestHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (!canonicalOrigin || !requestHost) {
    return null;
  }

  const isKnownAlternate = KNOWN_ALTERNATE_HOSTS.some((host) =>
    typeof host === "string" ? host === requestHost : host.test(requestHost)
  );

  if (!isKnownAlternate) {
    return null;
  }

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
