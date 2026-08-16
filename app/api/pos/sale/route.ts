import { NextResponse } from "next/server";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { CommerceError } from "@/lib/commerce/errors";
import { completePosSale, type CommerceActor } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { isProductionAppEnv } from "@/lib/env/server";

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
};

export async function POST(request: Request) {
  try {
    const context = getCommerceServerContext();
    if (!context) {
      throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
    }

    const [body, actor] = await Promise.all([
      request.json() as Promise<PosSaleRequestBody>,
      getPosActor()
    ]);
    const paymentMethod = parsePaymentMethod(body.paymentMethod);
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
      items: parsePosLines(body.items),
      paymentMethod,
      paymentProvider: paymentMethod === "cash" ? "CASH" : "MANUAL",
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

async function getPosActor(): Promise<CommerceActor> {
  try {
    return await getRequiredAdminActor();
  } catch (error) {
    if (isProductionAppEnv()) {
      throw error;
    }

    return {
      uid: "local-pos-staff",
      roleIds: ["role-sales-staff"]
    };
  }
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
  return value === "cash" || value === "mobile_money" || value === "manual_transfer"
    ? value
    : "cash";
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
