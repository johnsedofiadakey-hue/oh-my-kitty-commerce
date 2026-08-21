import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ohmykittygh.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Cart/checkout carry their own per-page noindex too — listed here
        // as well so crawlers skip fetching them at all, not just indexing.
        disallow: ["/admin", "/pos", "/cart", "/checkout", "/search", "/api"]
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
