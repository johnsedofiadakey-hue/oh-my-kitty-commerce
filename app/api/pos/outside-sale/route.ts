import { NextResponse } from "next/server";
import { getRequiredPosActor } from "@/lib/auth/pos-server";
import { CommerceError } from "@/lib/commerce/errors";
import { recordOutsideSale } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { applyPosPromoCode, parsePosLines } from "@/lib/pos/sale-request";

/**
 * Records a sale agreed off the website — WhatsApp, Instagram, a phone call —
 * where the money is already in one of the shop's MoMo wallets.
 *
 * Deliberately separate from /api/pos/sale: that route settles a counter sale,
 * which is finished the moment it is paid. This one creates an order that
 * still has to be packed and delivered, so it goes through recordOutsideSale
 * (channel ADMIN_CREATED) and lands UNFULFILLED in the dispatch queue.
 *
 * Not offline-queueable, and that is intentional — the duplicate-reference
 * check has to read existing payments, and a queued-up offline sale would
 * skip exactly the check that catches a reused screenshot.
 */
type OutsideSaleRequestBody = {
  allowDuplicateReference?: unknown;
  amountReceived?: unknown;
  customer?: {
    name?: unknown;
    phone?: unknown;
    address?: unknown;
  };
  deliveryTotal?: unknown;
  idempotencyKey?: unknown;
  items?: unknown;
  payerNumber?: unknown;
  paymentReference?: unknown;
  promoCode?: unknown;
  receivedInto?: unknown;
};

export async function POST(request: Request) {
  try {
    const context = getCommerceServerContext();
    if (!context) {
      throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
    }

    const [body, actor] = await Promise.all([
      request.json() as Promise<OutsideSaleRequestBody>,
      getRequiredPosActor()
    ]);

    const promoCode = normalizeOptionalString(body.promoCode);
    const { items, promotionId } = await applyPosPromoCode(context, actor, promoCode, parsePosLines(body.items));

    const sale = await recordOutsideSale(context, actor, {
      allowDuplicateReference: body.allowDuplicateReference === true,
      amountReceived: parseOptionalMoneyMinorUnit(body.amountReceived),
      channel: "ADMIN_CREATED",
      customerSnapshot: {
        name: normalizeOptionalString(body.customer?.name),
        phone: normalizeOptionalString(body.customer?.phone) ?? null,
        address: normalizeOptionalString(body.customer?.address) ?? null
      },
      deliveryTotal: parseOptionalMoneyMinorUnit(body.deliveryTotal) ?? 0,
      idempotencyKey:
        normalizeOptionalString(body.idempotencyKey) ??
        `outside-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      items,
      // The money is already in her wallet; nothing is being charged here.
      // mobile_money + MANUAL is what distinguishes that from a Paystack
      // collection, which is mobile_money + PAYSTACK.
      paymentMethod: "mobile_money",
      paymentProvider: "MANUAL",
      paymentReference: normalizeOptionalString(body.paymentReference) ?? null,
      payerNumber: normalizeOptionalString(body.payerNumber) ?? null,
      receivedInto: normalizeOptionalString(body.receivedInto) ?? null,
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

  return "Recording the sale failed.";
}
