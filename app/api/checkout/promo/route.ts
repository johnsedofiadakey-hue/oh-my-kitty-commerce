import { NextResponse } from "next/server";
import { CommerceError } from "@/lib/commerce/errors";
import { evaluatePromotionCode } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { formatMoney } from "@/lib/commerce/format";
import { getStorefrontCatalogue, toStorefrontProductViews } from "@/lib/storefront/catalogue";

type PromoLineInput = {
  productId?: unknown;
  variantId?: unknown;
  quantity?: unknown;
};

type PromoRequestBody = {
  code?: unknown;
  items?: unknown;
};

/**
 * Preview-only: computes what a promo code would discount without creating
 * an order. Never trusts client-supplied prices — looks the current price
 * of each line up from the live catalogue server-side.
 */
export async function POST(request: Request) {
  try {
    const context = getCommerceServerContext();
    if (!context) {
      throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
    }

    const body = (await request.json()) as PromoRequestBody;
    const code = normalizeOptionalString(body.code);
    if (!code) {
      throw new CommerceError("VALIDATION_ERROR", "Enter a promo code.");
    }

    const requestedLines = parsePromoLines(body.items);
    const catalogue = await getStorefrontCatalogue();
    const products = toStorefrontProductViews(catalogue);
    const productById = new Map(products.map((product) => [product.variantId, product]));

    const items = requestedLines.map((line) => {
      const product = productById.get(line.variantId);
      if (!product) {
        throw new CommerceError("VALIDATION_ERROR", "One of the items in your cart is no longer available.");
      }
      return {
        productId: product.id,
        variantId: product.variantId,
        quantity: line.quantity,
        unitPrice: product.price
      };
    });

    const evaluation = await evaluatePromotionCode(context, { code, channel: "ONLINE", items });

    return NextResponse.json({
      code: evaluation.promotion.code,
      discountTotal: evaluation.discountTotal,
      formattedDiscount: formatMoney(evaluation.discountTotal)
    });
  } catch (error) {
    return NextResponse.json(
      { message: getRouteErrorMessage(error) },
      { status: error instanceof CommerceError ? 400 : 500 }
    );
  }
}

function parsePromoLines(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new CommerceError("VALIDATION_ERROR", "Your cart is empty.");
  }

  return value.map((entry) => {
    const line = entry as PromoLineInput;
    return {
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

  return "Could not apply that code.";
}
