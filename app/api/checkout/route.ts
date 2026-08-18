import { NextResponse } from "next/server";
import { CommerceError } from "@/lib/commerce/errors";
import { completeOnlineOrder } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";

type CheckoutLineInput = {
  productId?: unknown;
  variantId?: unknown;
  quantity?: unknown;
};

type CheckoutRequestBody = {
  customer?: {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    address?: unknown;
    notes?: unknown;
  };
  deliveryRuleId?: unknown;
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

    const body = (await request.json()) as CheckoutRequestBody;
    const items = parseCheckoutLines(body.items);
    const deliveryTotal = await resolveDeliveryFee(context, body.deliveryRuleId);

    const sale = await completeOnlineOrder(context, {
      channel: "ONLINE",
      customerSnapshot: {
        name: normalizeOptionalString(body.customer?.name),
        email: normalizeOptionalString(body.customer?.email) ?? null,
        phone: normalizeOptionalString(body.customer?.phone) ?? null,
        address: normalizeOptionalString(body.customer?.address) ?? null,
        notes: normalizeOptionalString(body.customer?.notes) ?? null
      },
      deliveryTotal,
      taxTotal: 0,
      idempotencyKey:
        normalizeOptionalString(body.idempotencyKey) ??
        `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      items,
      paymentMethod: parsePaymentMethod(body.paymentMethod),
      paymentProvider: "MANUAL"
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

function parseCheckoutLines(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new CommerceError("VALIDATION_ERROR", "Add at least one item to checkout.");
  }

  return value.map((entry) => {
    const line = entry as CheckoutLineInput;
    return {
      productId: normalizeRequiredString(line.productId, "productId"),
      variantId: normalizeRequiredString(line.variantId, "variantId"),
      quantity: parsePositiveInteger(line.quantity)
    };
  });
}

function parsePaymentMethod(value: unknown) {
  return value === "cash" || value === "mobile_money" || value === "card" || value === "other"
    ? value
    : "manual_transfer";
}

async function resolveDeliveryFee(
  context: NonNullable<ReturnType<typeof getCommerceServerContext>>,
  deliveryRuleId: unknown
) {
  const id = normalizeOptionalString(deliveryRuleId);
  if (!id) {
    throw new CommerceError("VALIDATION_ERROR", "Choose a delivery or pickup option.");
  }

  const rules = await context.repo.listDeliveryRules();
  const rule = rules.find((entry) => entry.id === id && entry.active);
  if (!rule) {
    throw new CommerceError("VALIDATION_ERROR", "That delivery option is no longer available.");
  }

  return rule.fee;
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

  return "Checkout failed.";
}
