"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { usePhotoBackdrop } from "@/lib/storefront/use-photo-backdrop";
import type { StorefrontProductView } from "@/lib/storefront/catalogue";

/**
 * The "related products" card used on the shop page's best-sellers strip
 * and the PDP's "You might also like" strip. Samples the product photo's
 * own edge color and applies it as the whole card's background, replacing
 * the static per-tone color — otherwise a white-backed photo (e.g. the mist
 * bottle) shows a visible seam against a peach/green/ivory tone card.
 */
export function ShowcaseCard({ product }: { product: StorefrontProductView }) {
  const { backgroundColor, handleLoad } = usePhotoBackdrop();

  return (
    <Link
      className={`showcase-card ${product.tone}`}
      href={`/products/${product.slug}` as Route}
      style={backgroundColor ? { background: backgroundColor } : undefined}
    >
      <div className="product-related-photo" aria-hidden="true">
        {product.imageUrl ? <Image alt="" fill onLoad={handleLoad} sizes="220px" src={product.imageUrl} /> : null}
      </div>
      <div>
        {product.bestSeller ? <span>Best seller</span> : null}
        {product.freeDelivery ? <span className="showcase-free-delivery-tag">Free delivery</span> : null}
        <h3>{product.title}</h3>
        <p>{product.shortCopy}</p>
        <strong>{product.formattedPrice}</strong>
      </div>
    </Link>
  );
}
