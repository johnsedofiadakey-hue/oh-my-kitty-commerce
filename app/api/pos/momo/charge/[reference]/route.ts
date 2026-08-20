import { NextResponse } from "next/server";
import { getRequiredPosActor } from "@/lib/auth/pos-server";
import { CommerceError } from "@/lib/commerce/errors";
import { confirmPaystackPayment } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";

type RouteParams = { params: Promise<{ reference: string }> };

/**
 * Polled by the POS UI while a mobile money charge is in flight. Always
 * re-verifies with Paystack directly rather than trusting any cached charge
 * status — same "never trust a client-supplied success" principle as the
 * Paystack webhook handler.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const context = getCommerceServerContext();
    if (!context) {
      throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
    }

    const { reference } = await params;
    await getRequiredPosActor();

    const order = await context.repo.findOrderByIdempotencyKey(reference);
    if (!order) {
      return NextResponse.json({ message: "Charge not found." }, { status: 404 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({
        status: "success",
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total
      });
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json({ status: "cancelled" });
    }

    const verified = await verifyPaystackTransaction(reference);

    if (verified.status === "success") {
      await confirmPaystackPayment(context, { orderId: order.id, providerReference: reference });
      return NextResponse.json({
        status: "success",
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total
      });
    }

    if (verified.status === "failed" || verified.status === "abandoned") {
      return NextResponse.json({
        status: "failed",
        message: "The customer's network reported this payment did not complete."
      });
    }

    return NextResponse.json({ status: "pending" });
  } catch (error) {
    return NextResponse.json(
      { message: getRouteErrorMessage(error) },
      { status: error instanceof CommerceError ? 400 : 500 }
    );
  }
}

function getRouteErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Could not check the mobile money charge.";
}
