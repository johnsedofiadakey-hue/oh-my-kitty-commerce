import { NextResponse } from "next/server";
import { getRequiredPosActor } from "@/lib/auth/pos-server";
import { CommerceError } from "@/lib/commerce/errors";
import { closePosShift, openPosShift } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";

type OpenShiftRequestBody = {
  openingCash?: unknown;
};

type CloseShiftRequestBody = {
  closingCash?: unknown;
  id?: unknown;
  notes?: unknown;
};

export async function POST(request: Request) {
  try {
    const context = getCommerceServerContext();
    if (!context) {
      throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
    }

    const [body, actor] = await Promise.all([
      request.json() as Promise<OpenShiftRequestBody>,
      getRequiredPosActor()
    ]);
    const shift = await openPosShift(context, actor, {
      openingCash: parseOptionalMoneyMinorUnit(body.openingCash)
    });

    return NextResponse.json({
      id: shift.id,
      openedAt: shift.openedAt,
      openingCash: shift.openingCash,
      status: shift.status
    });
  } catch (error) {
    return NextResponse.json(
      { message: getRouteErrorMessage(error) },
      { status: error instanceof CommerceError ? 400 : 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const context = getCommerceServerContext();
    if (!context) {
      throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
    }

    const [body, actor] = await Promise.all([
      request.json() as Promise<CloseShiftRequestBody>,
      getRequiredPosActor()
    ]);
    const shift = await closePosShift(context, actor, {
      closingCash: parseOptionalMoneyMinorUnit(body.closingCash),
      id: normalizeRequiredString(body.id, "id"),
      notes: normalizeOptionalString(body.notes)
    });

    return NextResponse.json({
      closingCash: shift.closingCash,
      difference: shift.difference,
      expectedCash: shift.expectedCash,
      id: shift.id,
      status: shift.status
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

  return "POS shift action failed.";
}
