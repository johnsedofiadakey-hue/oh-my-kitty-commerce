import Link from "next/link";
import { AddToBagButton } from "@/components/storefront/add-to-bag-button";
import {
  formatStorefrontMoney,
  getStorefrontCatalogue
} from "@/lib/storefront/catalogue";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const catalogue = await getStorefrontCatalogue();

  return (
    <main className="shop-page">
      <header className="shop-header">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <Link className="portal-link" href="/cart">
          Bag
        </Link>
      </header>
      <section className="shop-intro">
        <span className="scene-kicker">Shop</span>
        <h1>Shop your care.</h1>
        {catalogue.sourceMessage ? <p>{catalogue.sourceMessage}</p> : null}
      </section>
      <section className="store-product-grid" aria-label="Products">
        {catalogue.cards.map(({ product, variant }, index) => (
          <article className="store-product-card" key={variant.id}>
            <div className={`store-product-visual tone-${index % 3}`} aria-hidden="true">
              <span>{product.title.slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="store-product-copy">
              <span>{variant.title}</span>
              <h2>{product.title}</h2>
              <p>{product.shortCopy ?? "Soft daily care."}</p>
              <strong>{formatStorefrontMoney(variant.price)}</strong>
              <AddToBagButton
                line={{
                  productId: product.id,
                  variantId: variant.id,
                  productTitle: product.title,
                  variantTitle: variant.title,
                  sku: variant.sku,
                  unitPrice: variant.price,
                  quantity: 1
                }}
              />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
