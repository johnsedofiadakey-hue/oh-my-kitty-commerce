import type { ProductVariant } from "@/lib/commerce/types";

/**
 * How many units of `variant` could actually be sold right now.
 *
 * A "set" (bundleComponents is non-empty) has no stock of its own — its
 * availability is however many full sets the current component stock can
 * still cover, computed fresh every time rather than tracked as a separate
 * number. A missing or untracked component doesn't constrain availability
 * (nothing to run out of); a tracked component that isn't there at all is
 * treated as zero stock, same as if it were simply out.
 *
 * Everything else (a plain product, or a "set" with no components defined)
 * just reports its own stockAvailable, unchanged from before.
 */
export function computeAvailableStock(variant: ProductVariant, variantsById: Map<string, ProductVariant>): number {
  if (!variant.bundleComponents || variant.bundleComponents.length === 0) {
    return variant.stockAvailable;
  }

  let coverage = Number.POSITIVE_INFINITY;
  for (const component of variant.bundleComponents) {
    const componentVariant = variantsById.get(component.variantId);
    if (!componentVariant || !componentVariant.trackInventory) {
      continue;
    }

    coverage = Math.min(coverage, Math.floor(componentVariant.stockAvailable / component.quantity));
  }

  return Number.isFinite(coverage) ? Math.max(0, coverage) : 0;
}

export function isSetVariant(variant: ProductVariant): boolean {
  return Boolean(variant.bundleComponents && variant.bundleComponents.length > 0);
}
