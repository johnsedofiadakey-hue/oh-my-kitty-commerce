import { NextResponse } from "next/server";
import { getRequiredPosActor } from "@/lib/auth/pos-server";
import { CommerceError } from "@/lib/commerce/errors";
import { cancelPendingPosMomoSale } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";

type RouteParams = { params: Promise<{ reference: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const context = getCommerceServerContext();
    if (!context) {
      throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
    }

    const { reference } = await params;
    const actor = await getRequiredPosActor();

    const order = await context.repo.findOrderByIdempotencyKey(reference);
    if (!order) {
      return NextResponse.json({ message: "Charge not found." }, { status: 404 });
    }

    const result = await cancelPendingPosMomoSale(context, actor, { orderId: order.id });

    return NextResponse.json({ status: result.order.status === "CANCELLED" ? "cancelled" : "success" });
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

  return "Could not cancel the mobile money charge.";
}
