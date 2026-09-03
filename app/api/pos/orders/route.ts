import { NextResponse } from "next/server";
import { getRequiredPosActor } from "@/lib/auth/pos-server";
import { CommerceError } from "@/lib/commerce/errors";
import { searchOrders } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";

export async function GET(request: Request) {
  try {
    const context = getCommerceServerContext();
    if (!context) {
      throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";
    const shiftId = url.searchParams.get("shiftId") ?? undefined;
    const actor = await getRequiredPosActor();
    const [orders, payments] = await Promise.all([
      searchOrders(context, actor, query, { posShiftId: shiftId }),
      context.repo.listPayments()
    ]);
    const paymentByOrderId = new Map(payments.map((payment) => [payment.orderId, payment]));

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        channel: order.channel,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfilmentStatus: order.fulfilmentStatus,
        total: order.total,
        customerName: order.customerSnapshot?.name ?? null,
        paymentMethod: paymentByOrderId.get(order.id)?.method ?? null
      }))
    });
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

  return "Order search failed.";
}
