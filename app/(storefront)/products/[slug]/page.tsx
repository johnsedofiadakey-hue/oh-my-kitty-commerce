import Link from "next/link";
import type { Route } from "next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailHero } from "@/components/storefront/product-detail-hero";
import { ShowcaseCard } from "@/components/storefront/showcase-card";
import { StorefrontNav } from "@/components/storefront/storefront-nav";
import { getStorefrontCatalogue, toStorefrontProductViews } from "@/lib/storefront/catalogue";
import { buildProductJsonLd } from "@/lib/seo/structured-data";

export const dynamic = "force-dynamic";

type ProductPageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageParams): Promise<Metadata> {
  const { slug } = await params;
  const catalogue = await getStorefrontCatalogue();
  const product = toStorefrontProductViews(catalogue).find((entry) => entry.slug === slug);

  if (!product) {
    return { title: "Product not found" };
  }

  const description = product.shortCopy || product.description || `${product.title} — ${product.formattedPrice}.`;

  return {
    title: product.title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.title,
      description,
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined
    }
  };
}

export default async function ProductDetailPage({ params }: ProductPageParams) {
  const { slug } = await params;
  const catalogue = await getStorefrontCatalogue();
  const products = toStorefrontProductViews(catalogue);
  const variants = products.filter((entry) => entry.slug === slug);
  const product = variants[0];

  if (!product) {
    notFound();
  }

  // No shared taxonomy signal to match on (categories are gone, and
  // concern/product-type/routine tags aren't populated on real products
  // either) — best-sellers first, then just other products, is an honest
  // "you might also like" that actually shows something with real data.
  const relatedProducts = products
    .filter((entry) => entry.slug !== product.slug)
    .filter((entry, index, all) => all.findIndex((other) => other.slug === entry.slug) === index)
    .sort((first, second) => Number(second.bestSeller) - Number(first.bestSeller))
    .slice(0, 4);

  return (
    <main className="product-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProductJsonLd(product)) }}
      />
      <StorefrontNav />

      <ProductDetailHero variants={variants} />

      <section className="product-detail-info" aria-label="Product details">
        <article>
          <span>Format</span>
          <strong>{product.variantTitle.toLowerCase() === "default" ? "Standard" : product.variantTitle}</strong>
          <p>Product code {product.sku.toUpperCase()}</p>
        </article>
        <article>
          <span>How to use</span>
          <strong>{product.care?.usage ?? "Use only as directed on the product packaging."}</strong>
        </article>
        <article>
          <span>Ingredients</span>
          <strong>{product.care?.ingredients ?? "Please check the product package for the latest ingredient details."}</strong>
        </article>
        <article>
          <span>Safety</span>
          <strong>
            {product.care?.warnings ??
              "Follow the package label and seek professional advice where needed."}
          </strong>
        </article>
      </section>

      <section className="product-support-band">
        <div>
          <span className="scene-kicker">Delivery</span>
          <h2>Pickup, Urgent Delivery, and Free Delivery can be selected at checkout.</h2>
        </div>
        <Link className="portal-link inverted" href={"/delivery" as Route}>
          Delivery info
        </Link>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="related-products">
          <div className="front-product-intro">
            <span className="scene-kicker">You might also like</span>
            <h2>More from Oh My Kitty.</h2>
          </div>
          <div className="showcase-grid">
            {relatedProducts.map((entry) => (
              <ShowcaseCard key={entry.variantId} product={entry} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
