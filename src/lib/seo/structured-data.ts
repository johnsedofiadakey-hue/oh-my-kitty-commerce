const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ohmykittygh.com";

function absoluteUrl(url: string) {
  return url.startsWith("http") ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function buildOrganizationJsonLd(whatsappNumber: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Oh My Kitty",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/oh-my-kitty-logo.jpeg`,
    description: "Feminine wellness and intimate care, shipped or picked up in Accra, Ghana.",
    sameAs: [
      "https://www.instagram.com/ohmykitty_30/",
      "https://www.tiktok.com/@ohmykitty_30",
      "https://snapchat.com/t/d02oD04F"
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: whatsappNumber,
      contactType: "customer service",
      areaServed: "GH",
      availableLanguage: "English"
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
