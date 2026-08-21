import { NextResponse } from "next/server";
import { CommerceError } from "@/lib/commerce/errors";
import { createPendingOnlineOrder, evaluatePromotionCode } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { getStorefrontCatalogue, toStorefrontProductViews } from "@/lib/storefront/catalogue";
import { isShopClosed } from "@/lib/storefront/content";
import {
  initializePaystackTransaction,
  isPaystackConfigured,
  placeholderEmailForPhone
} from "@/lib/payments/paystack";

type CheckoutLineInput = {
  productId?: unknown;
  variantId?: unknown;
  quantity?: unknown;
};

type PaystackCheckoutRequestBody = {
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
  promoCode?: unknown;
};

export async function POST(request: Request) {
  try {
    if (await isShopClosed()) {
      throw new CommerceError("INVALID_STATE", "We're not taking new orders right now — check back soon.");
    }

    if (!isPaystackConfigured()) {
      throw new CommerceError(
        "INVALID_STATE",
        "Card payment isn't set up yet — choose mobile money or manual transfer."
      );
    }

    const context = getCommerceServerContext();
    if (!context) {
      throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
    }

    const body = (await request.json()) as PaystackCheckoutRequestBody;
    const items = parseCheckoutLines(body.items);
    const phone = normalizeOptionalString(body.customer?.phone);
    if (!phone) {
      throw new CommerceError("VALIDATION_ERROR", "A phone number is required.");
    }

    // Email is optional for the customer — Paystack's API still requires
    // some email on the transaction, so when none is given we derive a
    // harmless placeholder from their phone number instead of blocking checkout.
    const email = normalizeOptionalString(body.customer?.email) ?? placeholderEmailForPhone(phone);

    const deliveryTotal = await resolveDeliveryFee(context, body.deliveryRuleId);
    const idempotencyKey =
      normalizeOptionalString(body.idempotencyKey) ??
      `checkout-paystack-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const promoCode = normalizeOptionalString(body.promoCode);
    const { items: itemsWithDiscounts, promotionId } = await applyPromoCode(context, promoCode, items);

    const pending = await createPendingOnlineOrder(context, {
      customerSnapshot: {
        name: normalizeOptionalString(body.customer?.name),
        email,
        phone,
        address: normalizeOptionalString(body.customer?.address) ?? null,
        notes: normalizeOptionalString(body.customer?.notes) ?? null
      },
      deliveryTotal,
      taxTotal: 0,
      idempotencyKey,
      items: itemsWithDiscounts,
      paymentMethod: "card",
      promotionId,
      promoCode: promotionId ? promoCode : null
    });

    if (pending.idempotent) {
      return NextResponse.json({
        orderId: pending.order.id,
        orderNumber: pending.order.orderNumber,
        total: pending.order.total,
        alreadyPending: true
      });
    }

    const siteUrl = getSiteUrl();
    const init = await initializePaystackTransaction({
      amountMinorUnit: pending.order.total,
      email,
      reference: pending.order.idempotencyKey,
      callbackUrl: `${siteUrl}/checkout/paystack/callback`,
      metadata: { orderId: pending.order.id, orderNumber: pending.order.orderNumber }
    });

    return NextResponse.json({
      orderId: pending.order.id,
      orderNumber: pending.order.orderNumber,
      total: pending.order.total,
      authorizationUrl: init.authorizationUrl
    });
  } catch (error) {
    return NextResponse.json(
      { message: getRouteErrorMessage(error) },
      { status: error instanceof CommerceError ? 400 : 500 }
    );
  }
}

/**
 * Re-validates the promo code server-side against the real live prices —
 * never trusts a client-supplied discount amount — and merges the computed
 * per-line discount into each item before the order is built.
 */
async function applyPromoCode(
  context: NonNullable<ReturnType<typeof getCommerceServerContext>>,
  promoCode: string | undefined,
  items: { productId: string; variantId: string; quantity: number }[]
): Promise<{
  items: { productId: string; variantId: string; quantity: number; discountTotal?: number }[];
  promotionId: string | null;
}> {
  if (!promoCode) {
    return { items, promotionId: null };
  }

  const catalogue = await getStorefrontCatalogue();
  const products = toStorefrontProductViews(catalogue);
  const productByVariantId = new Map(products.map((product) => [product.variantId, product]));

  const evaluationLines = items.map((item) => {
    const product = productByVariantId.get(item.variantId);
    if (!product) {
      throw new CommerceError("VALIDATION_ERROR", "One of the items in your cart is no longer available.");
    }
    return {
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: product.price
    };
  });

  const evaluation = await evaluatePromotionCode(context, {
    code: promoCode,
    channel: "ONLINE",
    items: evaluationLines
  });

  const itemsWithDiscounts = items.map((item) => ({
    ...item,
    discountTotal: evaluation.lineDiscounts.get(item.variantId) ?? 0
  }));

  return { items: itemsWithDiscounts, promotionId: evaluation.promotion.id };
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
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
