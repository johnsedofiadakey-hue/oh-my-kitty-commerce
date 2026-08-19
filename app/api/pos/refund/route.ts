import { NextResponse } from "next/server";
import { getRequiredPosActor } from "@/lib/auth/pos-server";
import { verifyManagerApprover } from "@/lib/auth/server";
import { CommerceError } from "@/lib/commerce/errors";
import { refundPosSale } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";

type PosRefundRequestBody = {
  orderId?: unknown;
  reason?: unknown;
  restock?: unknown;
  approverIdToken?: unknown;
};

export async function POST(request: Request) {
  try {
    const context = getCommerceServerContext();
    if (!context) {
      throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
    }

    const [body, actor] = await Promise.all([
      request.json() as Promise<PosRefundRequestBody>,
      getRequiredPosActor()
    ]);

    const approverIdToken = normalizeOptionalString(body.approverIdToken);
    const approverActor = approverIdToken ? await verifyManagerApprover(approverIdToken) : undefined;

    const result = await refundPosSale(
      context,
      actor,
      {
        orderId: normalizeRequiredString(body.orderId, "orderId"),
        reason: normalizeRequiredString(body.reason, "reason"),
        restock: body.restock !== false
      },
      approverActor
    );

    return NextResponse.json({
      orderId: result.order.id,
      status: result.order.status,
      paymentStatus: result.order.paymentStatus,
      idempotent: result.idempotent
    });
  } catch (error) {
    return NextResponse.json(
      { message: getRouteErrorMessage(error) },
      { status: error instanceof CommerceError ? 400 : 500 }
    );
  }
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

  return "POS refund failed.";
}
