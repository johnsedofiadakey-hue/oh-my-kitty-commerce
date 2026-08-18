import { NextResponse } from "next/server";
import { confirmPaystackPayment } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { verifyPaystackTransaction, verifyPaystackWebhookSignature } from "@/lib/payments/paystack";

type PaystackWebhookEvent = {
  event?: string;
  data?: {
    reference?: string;
    metadata?: { orderId?: string };
  };
};

export async function POST(request: Request) {
  // Paystack signs the raw body — read it as text before parsing so the
  // signature check runs against exactly what Paystack sent, not a
  // re-serialized version of it.
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ message: "Invalid signature." }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as PaystackWebhookEvent;
  if (event.event !== "charge.success") {
    // Acknowledge every other event type so Paystack stops retrying it.
    return NextResponse.json({ received: true });
  }

  const reference = event.data?.reference;
  const orderId = event.data?.metadata?.orderId;
  if (!reference || !orderId) {
    return NextResponse.json({ message: "Missing reference/orderId in webhook payload." }, { status: 400 });
  }

  const context = getCommerceServerContext();
  if (!context) {
    return NextResponse.json({ message: "Firebase Admin is not configured." }, { status: 500 });
  }

  // Never trust the webhook body alone — verify directly with Paystack's API
  // before marking anything paid.
  const verified = await verifyPaystackTransaction(reference);
  if (verified.status !== "success") {
    return NextResponse.json({ received: true, confirmed: false });
  }

  await confirmPaystackPayment(context, { orderId, providerReference: reference });

  return NextResponse.json({ received: true, confirmed: true });
}
