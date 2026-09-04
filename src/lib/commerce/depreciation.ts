import type { CapitalAsset } from "@/lib/commerce/types";

/**
 * Straight-line book value as of `asOf` (defaults to now) — the standard,
 * simplest depreciation method and the right default for a small business
 * register rather than anything method-specific (declining balance, etc).
 * Assets with trackDepreciation off just report their purchase cost
 * unchanged, since nothing here should mutate purchaseCost itself.
 */
export function computeAssetBookValue(asset: CapitalAsset, asOf: Date = new Date()): number {
  if (!asset.trackDepreciation || !asset.usefulLifeYears || asset.usefulLifeYears <= 0) {
    return asset.purchaseCost;
  }

  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const yearsElapsed = Math.max(0, (asOf.getTime() - asset.purchaseDate.getTime()) / msPerYear);
  const annualDepreciation = asset.purchaseCost / asset.usefulLifeYears;
  const depreciated = Math.min(asset.purchaseCost, annualDepreciation * yearsElapsed);

  return Math.round(Math.max(0, asset.purchaseCost - depreciated));
}
