import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import {
  AddToBagButton,
  type CartLine
} from "@/components/storefront/add-to-bag-button";
import { CartCount } from "@/components/storefront/cart-count";
import {
  getStorefrontCatalogue,
  toStorefrontProductViews,
  type StorefrontProductView
} from "@/lib/storefront/catalogue";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalogue = await getStorefrontCatalogue();
  const products = toStorefrontProductViews(catalogue);
  const product = products.find((entry) => entry.slug === slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = products
    .filter(
      (entry) =>
        entry.variantId !== product.variantId &&
        entry.categorySlugs.some((categorySlug) => product.categorySlugs.includes(categorySlug))
    )
    .slice(0, 4);

  return (
    <main className="product-detail-page">
      <header className="shop-header cinematic">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <Link className="bag-pill" href="/cart">
          <CartCount />
        </Link>
      </header>

      <section className={`product-detail-hero ${product.tone}`}>
        <div className="product-detail-stage" aria-hidden="true">
          {product.imageUrl ? (
            <Image
              alt=""
              fill
              priority
              sizes="(max-width: 820px) 92vw, 520px"
              src={product.imageUrl}
            />
          ) : (
            <Image
              alt=""
              height={160}
              priority
              src="/brand/oh-my-kitty-logo.jpeg"
              width={160}
            />
          )}
        </div>
        <div className="product-detail-copy">
          <Link
            className="scene-kicker"
            href={`/categories/${product.primaryCategorySlug}` as Route}
          >
            {product.primaryCategory}
          </Link>
          <h1>{product.title}</h1>
          <p>{product.description ?? product.shortCopy}</p>
          <div className="product-detail-price">
            <strong>{product.formattedPrice}</strong>
            <span>{product.stockAvailable} available</span>
          </div>
          <div className="product-detail-actions">
            <AddToBagButton
              className="sheet-add-button"
              label="Add to bag"
              line={toCartLine(product)}
            />
            <Link className="sheet-cart-link" href="/cart">
              View bag
            </Link>
          </div>
        </div>
      </section>

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
          <h2>Pickup, Accra delivery, and nationwide delivery can be selected at checkout.</h2>
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

function toCartLine(product: StorefrontProductView): CartLine {
  return {
    productId: product.id,
    productTitle: product.title,
    quantity: 1,
    sku: product.sku,
    unitPrice: product.price,
    variantId: product.variantId,
    variantTitle: product.variantTitle
  };
}
