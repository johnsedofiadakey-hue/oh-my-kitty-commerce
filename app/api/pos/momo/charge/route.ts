import { NextResponse } from "next/server";
import { getRequiredPosActor } from "@/lib/auth/pos-server";
import { CommerceError } from "@/lib/commerce/errors";
import {
  confirmPaystackPayment,
  createPendingPosMomoOrder,
  evaluatePromotionCode,
  type CommerceActor,
  type CommerceContext
} from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { defaultRoles, hasPermission } from "@/lib/permissions/permissions";
import {
  chargePaystackMobileMoney,
  isPaystackConfigured,
  placeholderEmailForPhone,
  verifyPaystackTransaction,
  type MobileMoneyProvider
} from "@/lib/payments/paystack";

type PosLineInput = {
  productId?: unknown;
  variantId?: unknown;
  quantity?: unknown;
};

type MomoChargeRequestBody = {
  customer?: {
    name?: unknown;
    phone?: unknown;
  };
  idempotencyKey?: unknown;
  items?: unknown;
  posShiftId?: unknown;
  provider?: unknown;
  promoCode?: unknown;
};

const KNOWN_PROVIDERS: MobileMoneyProvider[] = ["mtn", "vod", "atl"];

export async function POST(request: Request) {
  try {
    if (!isPaystackConfigured()) {
      throw new CommerceError("INVALID_STATE", "Mobile money isn't set up yet — use cash or manual transfer.");
    }

    const context = getCommerceServerContext();
    if (!context) {
      throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
    }

    const [body, actor] = await Promise.all([
      request.json() as Promise<MomoChargeRequestBody>,
      getRequiredPosActor()
    ]);

    const phone = normalizeOptionalString(body.customer?.phone);
    if (!phone) {
      throw new CommerceError("VALIDATION_ERROR", "A customer phone number is required for mobile money.");
    }

    const provider = parseProvider(body.provider);
    const posShiftId = normalizeOptionalString(body.posShiftId);
    if (!posShiftId) {
      throw new CommerceError("INVALID_STATE", "POS sale requires an open shift.");
    }

    const idempotencyKey =
      normalizeOptionalString(body.idempotencyKey) ??
      `pos-momo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const promoCode = normalizeOptionalString(body.promoCode);
    const { items, promotionId } = await applyPromoCode(context, actor, promoCode, parsePosLines(body.items));

    const pending = await createPendingPosMomoOrder(context, actor, {
      customerSnapshot: {
        name: normalizeOptionalString(body.customer?.name),
        phone
      },
      deliveryTotal: 0,
      taxTotal: 0,
      idempotencyKey,
      items,
      posShiftId,
      promotionId,
      promoCode: promotionId ? promoCode : null
    });

    if (pending.idempotent && pending.payment?.status === "PAID") {
      return NextResponse.json({
        orderId: pending.order.id,
        orderNumber: pending.order.orderNumber,
        total: pending.order.total,
        reference: idempotencyKey,
        chargeStatus: "success",
        displayText: null
      });
    }

    const email = placeholderEmailForPhone(phone);
    const charge = await chargePaystackMobileMoney({
      amountMinorUnit: pending.order.total,
      email,
      reference: pending.order.idempotencyKey,
      phone,
      provider,
      metadata: { orderId: pending.order.id, orderNumber: pending.order.orderNumber }
    });

    // Some networks/test-mode configs settle synchronously on the initial
    // charge call itself rather than requiring the client to poll — never
    // trust that status directly, though: re-verify with Paystack before
    // confirming, same as the poll route and the webhook handler do. If
    // Paystack's own charge response and verify disagree, report "pending"
    // so the client falls back to polling instead of settling prematurely.
    let confirmedStatus = charge.status;
    if (charge.status === "success") {
      const verified = await verifyPaystackTransaction(charge.reference);
      if (verified.status === "success") {
        await confirmPaystackPayment(context, {
          orderId: pending.order.id,
          providerReference: charge.reference
        });
      } else {
        confirmedStatus = "pending";
      }
    }

    return NextResponse.json({
      orderId: pending.order.id,
      orderNumber: pending.order.orderNumber,
      total: pending.order.total,
      reference: charge.reference,
      chargeStatus: confirmedStatus,
      displayText: charge.displayText
    });
  } catch (error) {
    return NextResponse.json(
      { message: getRouteErrorMessage(error) },
      { status: error instanceof CommerceError ? 400 : 500 }
    );
  }
}

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

function parseProvider(value: unknown): MobileMoneyProvider {
  if (typeof value === "string" && KNOWN_PROVIDERS.includes(value as MobileMoneyProvider)) {
    return value as MobileMoneyProvider;
  }

  throw new CommerceError("VALIDATION_ERROR", "Choose a mobile money network.");
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

  return "Could not start the mobile money charge.";
}
