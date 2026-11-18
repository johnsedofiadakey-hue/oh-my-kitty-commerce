import { CommerceError } from "@/lib/commerce/errors";
import {
  evaluatePromotionCode,
  getEffectiveRoles,
  type CommerceActor,
  type CommerceContext
} from "@/lib/commerce/operations";
import { hasPermission } from "@/lib/permissions/permissions";

/**
 * Cart parsing and promo re-validation shared by the two tills: /api/pos/sale
 * (counter sale) and /api/pos/outside-sale (a WhatsApp/MoMo order). Both take
 * the same cart from the same UI, so the discount rules must not be allowed to
 * drift between them.
 */

type PosLineInput = {
  productId?: unknown;
  variantId?: unknown;
  quantity?: unknown;
};

export type PosSaleLine = {
  productId: string;
  variantId: string;
  quantity: number;
  discountTotal?: number;
};

export function parsePosLines(value: unknown): PosSaleLine[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new CommerceError("VALIDATION_ERROR", "Add at least one item to the POS cart.");
  }

  return value.map((entry) => {
    const line = entry as PosLineInput;
    return {
      productId: normalizeRequiredString(line.productId, "productId"),
      variantId: normalizeRequiredString(line.variantId, "variantId"),
      quantity: parsePositiveInteger(line.quantity)
    };
  });
}

/**
 * Re-validates the promo code server-side against real live variant prices
 * and merges the computed per-line discount into each item. Promotions
 * flagged requiresManagerApproval can only be applied by an actor whose
 * role already grants pos.price_override (Manager/Owner) — Sales Staff
 * can't self-approve one.
 */
export async function applyPosPromoCode(
  context: CommerceContext,
  actor: CommerceActor,
  promoCode: string | undefined,
  items: PosSaleLine[]
): Promise<{ items: PosSaleLine[]; promotionId: string | null }> {
  if (!promoCode) {
    return { items, promotionId: null };
  }

  const priceByVariantId = new Map<string, number>();
  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  const variantLists = await Promise.all(productIds.map((productId) => context.repo.listVariants(productId)));
  for (const variants of variantLists) {
    for (const variant of variants) {
      priceByVariantId.set(variant.id, variant.price);
    }
  }

  const evaluationLines = items.map((item) => {
    const unitPrice = priceByVariantId.get(item.variantId);
    if (unitPrice === undefined) {
      throw new CommerceError("VALIDATION_ERROR", "One of the items in the cart is no longer available.");
    }
    return { productId: item.productId, variantId: item.variantId, quantity: item.quantity, unitPrice };
  });

  const evaluation = await evaluatePromotionCode(context, {
    code: promoCode,
    channel: "POS",
    items: evaluationLines
  });

  if (evaluation.promotion.requiresManagerApproval) {
    const roles = await getEffectiveRoles(context, actor.roleIds);
    if (!hasPermission(roles, actor, "pos.price_override")) {
      throw new CommerceError("FORBIDDEN", "This code needs a manager — ask a manager to apply it.");
    }
  }

  return {
    items: items.map((item) => ({
      ...item,
      discountTotal: evaluation.lineDiscounts.get(item.variantId) ?? 0
    })),
    promotionId: evaluation.promotion.id
  };
}

function parsePositiveInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new CommerceError("VALIDATION_ERROR", "Quantity must be at least 1.");
  }

  return value;
}

function normalizeRequiredString(value: unknown, key: string) {
  const normalized = typeof value === "string" && value.trim() ? value.trim() : undefined;
  if (!normalized) {
    throw new CommerceError("VALIDATION_ERROR", `${key} is required.`);
  }

  return normalized;
}
