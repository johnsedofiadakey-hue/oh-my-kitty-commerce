import { NextResponse } from "next/server";
import { getRequiredPosActor } from "@/lib/auth/pos-server";
import { CommerceError } from "@/lib/commerce/errors";
import { completePosSale } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { applyPosPromoCode, parsePosLines } from "@/lib/pos/sale-request";

type PosSaleRequestBody = {
  amountReceived?: unknown;
  customer?: {
    name?: unknown;
    phone?: unknown;
    address?: unknown;
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
    const { items, promotionId } = await applyPosPromoCode(context, actor, promoCode, parsePosLines(body.items));

    const sale = await completePosSale(context, actor, {
      amountReceived: parseOptionalMoneyMinorUnit(body.amountReceived),
      channel: "POS",
      customerSnapshot: {
        name: normalizeOptionalString(body.customer?.name),
        phone: normalizeOptionalString(body.customer?.phone) ?? null,
        address: normalizeOptionalString(body.customer?.address) ?? null
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

function parsePaymentMethod(value: unknown) {
  // Mobile money settles through /api/pos/momo/charge instead, which only
  // marks a sale paid after a server-side Paystack verification — never
  // instantly, the way this route settles cash/card/manual_transfer. Money
  // already sitting in the shop's own wallet is a different thing again, and
  // goes through /api/pos/outside-sale.
  if (value === "mobile_money") {
    throw new CommerceError(
      "VALIDATION_ERROR",
      "Mobile money sales must go through the mobile money charge flow."
    );
  }

  // Anything unrecognised used to fall through to "cash", which quietly
  // recorded a cash sale that never happened and left the drawer short.
  if (value !== "cash" && value !== "card" && value !== "manual_transfer") {
    throw new CommerceError("VALIDATION_ERROR", "Choose a payment method.");
  }

  return value;
}

function parseOptionalMoneyMinorUnit(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
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
