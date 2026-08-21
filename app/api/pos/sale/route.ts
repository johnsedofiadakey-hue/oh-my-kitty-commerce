import { NextResponse } from "next/server";
import { getRequiredPosActor } from "@/lib/auth/pos-server";
import { CommerceError } from "@/lib/commerce/errors";
import { completePosSale, evaluatePromotionCode, type CommerceActor, type CommerceContext } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { defaultRoles, hasPermission } from "@/lib/permissions/permissions";

type PosLineInput = {
  productId?: unknown;
  variantId?: unknown;
  quantity?: unknown;
};

type PosSaleRequestBody = {
  amountReceived?: unknown;
  customer?: {
    name?: unknown;
    phone?: unknown;
  };
  idempotencyKey?: unknown;
  items?: unknown;
  paymentMethod?: unknown;
  posShiftId?: unknown;
  promoCode?: unknown;
};

export async function POST(request: Request) {
  try {
    const context = getCommerceServerContext();
    if (!context) {
      throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
    }

    const [body, actor] = await Promise.all([
      request.json() as Promise<PosSaleRequestBody>,
      getRequiredPosActor()
    ]);
    const paymentMethod = parsePaymentMethod(body.paymentMethod);
    const promoCode = normalizeOptionalString(body.promoCode);
    // Line discounts computed here flow into completePosSale, which already
    // requires the pos.discount permission whenever any item has a
    // discountTotal > 0 — no separate check needed for promo codes.
    const { items, promotionId } = await applyPromoCode(context, actor, promoCode, parsePosLines(body.items));

    const sale = await completePosSale(context, actor, {
      amountReceived: parseOptionalMoneyMinorUnit(body.amountReceived),
      channel: "POS",
      customerSnapshot: {
        name: normalizeOptionalString(body.customer?.name),
        phone: normalizeOptionalString(body.customer?.phone) ?? null
      },
      deliveryTotal: 0,
      idempotencyKey:
        normalizeOptionalString(body.idempotencyKey) ??
        `pos-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      items,
      paymentMethod,
      paymentProvider: paymentMethod === "cash" ? "CASH" : "MANUAL",
      posShiftId: normalizeOptionalString(body.posShiftId),
      promotionId,
      promoCode: promotionId ? promoCode : null,
      taxTotal: 0
    });

    return NextResponse.json({
      orderId: sale.order.id,
      orderNumber: sale.order.orderNumber,
      total: sale.order.total,
      idempotent: sale.idempotent
    });
  } catch (error) {
    return NextResponse.json(
      { message: getRouteErrorMessage(error) },
      { status: error instanceof CommerceError ? 400 : 500 }
    );
  }
}

/**
 * Re-validates the promo code server-side against real live variant prices
 * and merges the computed per-line discount into each item. Promotions
 * flagged requiresManagerApproval can only be applied by an actor whose
 * role already grants pos.price_override (Manager/Owner) — Sales Staff
 * can't self-approve one, mirroring the refund/void approval boundary.
 */
async function applyPromoCode(
  context: CommerceContext,
  actor: CommerceActor,
  promoCode: string | undefined,
  items: { productId: string; variantId: string; quantity: number }[]
): Promise<{
  items: { productId: string; variantId: string; quantity: number; discountTotal?: number }[];
  promotionId: string | null;
}> {
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

  if (evaluation.promotion.requiresManagerApproval && !hasPermission(defaultRoles, actor, "pos.price_override")) {
    throw new CommerceError("FORBIDDEN", "This code needs a manager — ask a manager to apply it.");
  }

  return {
    items: items.map((item) => ({
      ...item,
      discountTotal: evaluation.lineDiscounts.get(item.variantId) ?? 0
    })),
    promotionId: evaluation.promotion.id
  };
}

function parsePosLines(value: unknown) {
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

function parsePaymentMethod(value: unknown) {
  // Mobile money settles through /api/pos/momo/charge instead, which only
  // marks a sale paid after a server-side Paystack verification — never
  // instantly, the way this route settles cash/card/manual_transfer.
  if (value === "mobile_money") {
    throw new CommerceError(
      "VALIDATION_ERROR",
      "Mobile money sales must go through the mobile money charge flow."
    );
  }

  return value === "cash" || value === "card" || value === "manual_transfer" ? value : "cash";
}

function parseOptionalMoneyMinorUnit(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function parsePositiveInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new CommerceError("VALIDATION_ERROR", "Quantity must be at least 1.");
  }

  return value;
}

function normalizeRequiredString(value: unknown, key: string) {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    throw new CommerceError("VALIDATION_ERROR", `${key} is required.`);
  }

  return normalized;
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getRouteErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "POS sale failed.";
}
