const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ohmykittygh.com";

function absoluteUrl(url: string) {
  return url.startsWith("http") ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Ghana numbers are stored the way they are dialled locally ("0241448231"),
 * but schema.org wants E.164. Without the country code the number is just a
 * string to a search engine, rather than a Ghanaian phone number.
 */
function toE164Ghana(localNumber: string) {
  const digits = localNumber.replace(/[^0-9]/g, "");
  if (digits.startsWith("233")) {
    return `+${digits}`;
  }
  return `+233${digits.replace(/^0+/, "")}`;
}

/** "https://maps.google.com/?q=5.675043,-0.144152" -> the two numbers. */
function parseLatLng(mapLink: string) {
  const match = mapLink.match(/q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  return match ? { latitude: Number(match[1]), longitude: Number(match[2]) } : null;
}

/**
 * Declared as a Store (a LocalBusiness subtype) rather than a bare
 * Organization, with a real address and coordinates.
 *
 * "Oh My Kitty" collides with an older, larger US shop trading as
 * OhMyKitty4U, which is what a bare brand search returns. Nothing here
 * outranks them for that word — but a precise, verifiable local business in
 * Accra is a different entity to a search engine than a generic organisation
 * with the same name, and it is what makes the Ghana-qualified and
 * near-me searches winnable.
 */
export function buildOrganizationJsonLd(
  whatsappNumber: string,
  options: { pickupLocation?: string; mapLink?: string } = {}
) {
  const pickupLocation = options.pickupLocation ?? "Accra-Madina";
  const geo = options.mapLink ? parseLatLng(options.mapLink) : null;

  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${SITE_URL}/#store`,
    name: "Oh My Kitty",
    // The spellings customers actually type, so the variants resolve to one
    // entity instead of competing with each other.
    alternateName: ["Oh My Kitty Ghana", "OhMyKitty GH", "Oh My Kitty Intimate Care"],
    url: SITE_URL,
    logo: `${SITE_URL}/brand/oh-my-kitty-logo.jpeg`,
    image: `${SITE_URL}/brand/oh-my-kitty-logo.jpeg`,
    description: "Feminine wellness and intimate care, shipped nationwide in Ghana or picked up in Accra.",
    address: {
      "@type": "PostalAddress",
      addressLocality: pickupLocation.replace(/^Accra[-\s]*/i, "") || "Madina",
      addressRegion: "Greater Accra",
      addressCountry: "GH"
    },
    ...(geo ? { geo: { "@type": "GeoCoordinates", ...geo } } : {}),
    ...(options.mapLink ? { hasMap: options.mapLink } : {}),
    areaServed: { "@type": "Country", name: "Ghana" },
    currenciesAccepted: "GHS",
    paymentAccepted: "Cash, Mobile Money, Card",
    sameAs: [
      "https://www.instagram.com/ohmykitty_30/",
      "https://www.tiktok.com/@ohmykitty_30",
      "https://snapchat.com/t/d02oD04F"
    ],
    telephone: toE164Ghana(whatsappNumber),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: toE164Ghana(whatsappNumber),
      contactType: "customer service",
      areaServed: "GH",
      availableLanguage: "English"
    }
  };
}

/**
 * Names the site itself, separately from the business. Lets a search engine
 * attach the brand to this domain rather than inferring it, and is what
 * enables a sitelinks search box.
 */
export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "Oh My Kitty",
    alternateName: "Oh My Kitty Ghana",
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#store` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export function buildFaqJsonLd(entries: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer
      }
    }))
  };
}

export function buildArticleJsonLd(article: { title: string; description: string; slug: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: `${SITE_URL}/learn/${article.slug}`,
    publisher: {
      "@type": "Organization",
      name: "Oh My Kitty",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand/oh-my-kitty-logo.jpeg`
      }
    }
  };
}

export function buildProductJsonLd(product: {
  title: string;
  description?: string;
  shortCopy: string;
  sku: string;
  imageUrl?: string;
  price: number;
  stockAvailable: number;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? product.shortCopy,
    sku: product.sku,
    image: product.imageUrl ? [absoluteUrl(product.imageUrl)] : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: "GHS",
      price: (product.price / 100).toFixed(2),
      availability:
        product.stockAvailable > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };
}
