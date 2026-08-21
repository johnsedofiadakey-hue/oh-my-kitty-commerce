import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailHero } from "@/components/storefront/product-detail-hero";
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

  const relatedProducts = products
    .filter(
      (entry) =>
        entry.slug !== product.slug &&
        entry.categorySlugs.some((categorySlug) => product.categorySlugs.includes(categorySlug))
    )
    .filter((entry, index, all) => all.findIndex((other) => other.slug === entry.slug) === index)
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
          <span>Variant</span>
          <strong>{product.variantTitle}</strong>
          <p>{product.sku}</p>
        </article>
        <article>
          <span>How to use</span>
          <strong>{product.care?.usage ?? "Follow the instructions on the product packaging."}</strong>
        </article>
        <article>
          <span>Ingredients</span>
          <strong>{product.care?.ingredients ?? "Ingredient details will be confirmed by admin."}</strong>
        </article>
        <article>
          <span>Safety</span>
          <strong>
            {product.care?.warnings ??
              "External-use and supplement guidance should follow the package label."}
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
            <span className="scene-kicker">Related</span>
            <h2>More from this care world.</h2>
          </div>
          <div className="showcase-grid">
            {relatedProducts.map((entry) => (
              <Link
                className={`showcase-card ${entry.tone}`}
                href={`/products/${entry.slug}` as Route}
                key={entry.variantId}
              >
                <div className="product-related-photo" aria-hidden="true">
                  {entry.imageUrl ? <Image alt="" fill sizes="220px" src={entry.imageUrl} /> : null}
                </div>
                <div>
                  <span>{entry.primaryCategory}</span>
                  <h3>{entry.title}</h3>
                  <p>{entry.shortCopy}</p>
                  <strong>{entry.formattedPrice}</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
