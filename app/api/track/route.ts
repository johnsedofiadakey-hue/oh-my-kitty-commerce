import { NextResponse } from "next/server";
import { CommerceError } from "@/lib/commerce/errors";
import { trackOrder } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";

type TrackRequestBody = {
  orderNumber?: unknown;
};

export async function POST(request: Request) {
  try {
    const context = getCommerceServerContext();
    if (!context) {
      throw new CommerceError("INVALID_STATE", "Order tracking isn't available right now.");
    }

    const body = (await request.json().catch(() => null)) as TrackRequestBody | null;
    const orderNumber = normalizeString(body?.orderNumber);
    if (!orderNumber) {
      throw new CommerceError("VALIDATION_ERROR", "Enter your order number.");
    }

    const order = await trackOrder(context, orderNumber);
    if (!order) {
      return NextResponse.json(
        { message: "We couldn't find an order with that number. Double-check it and try again." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      channel: order.channel,
      paymentStatus: order.paymentStatus,
      fulfilmentStatus: order.fulfilmentStatus,
      total: order.total,
      deliveryTotal: order.deliveryTotal,
      createdAt: toIsoString(order.createdAt),
      deliveryAddress: order.customerSnapshot?.address ?? null,
      items: order.items.map((item) => ({
        productTitle: item.productTitle,
        variantTitle: item.variantTitle,
        quantity: item.quantity,
        mediaUrl: item.mediaUrl ?? null
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { message: getRouteErrorMessage(error) },
      { status: error instanceof CommerceError ? 400 : 500 }
    );
  }
}

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** Order.createdAt is really a Firestore Timestamp at runtime, not a Date — duck-type on .toDate(). */
function toIsoString(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return (value.toDate() as Date).toISOString();
  }

  return null;
}

function getRouteErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Order tracking failed.";
}
