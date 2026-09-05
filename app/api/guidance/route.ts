import { NextResponse } from "next/server";
import { CommerceError } from "@/lib/commerce/errors";
import { createGuidanceRequest, sendNewGuidanceRequestPush } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

type GuidanceRequestBody = {
  message?: unknown;
  contactNumber?: unknown;
  // Honeypot: a hidden field real customers never see or fill in. A bot
  // that blindly fills every field on the form trips this instead of
  // getting a validation error back to iterate against.
  company?: unknown;
};

export async function POST(request: Request) {
  if (!checkRateLimit(`guidance-request:${getClientIp(request)}`, 3, 60_000)) {
    return NextResponse.json({ message: "Too many attempts — please wait a moment and try again." }, { status: 429 });
  }

  try {
    const context = getCommerceServerContext();
    if (!context) {
      throw new CommerceError("INVALID_STATE", "Firebase Admin is not configured yet.");
    }

    const body = (await request.json()) as GuidanceRequestBody;

    if (typeof body.company === "string" && body.company.trim().length > 0) {
      return NextResponse.json({ ok: true });
    }

    const log = await createGuidanceRequest(context, {
      message: body.message,
      contactNumber: body.contactNumber
    });

    void sendNewGuidanceRequestPush(context, log);

    return NextResponse.json({ ok: true });
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

  return "Couldn't send your message — try again in a moment.";
}
