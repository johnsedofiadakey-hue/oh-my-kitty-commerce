import type { Metadata } from "next";
import { confirmPaystackPayment } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";
import { formatMoney } from "@/lib/commerce/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment status",
  robots: { index: false, follow: false }
};

type PageProps = {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
};

/**
 * Where Paystack redirects this tab after a POS mobile-money charge —
 * opened in a new tab by the register, separate from the main POS screen
 * that's polling the same reference. Either side can be first to confirm
 * the order (confirmPaystackPayment is idempotent), so this page's only
 * job is to tell whoever is looking at it that it's safe to close the tab.
 */
export default async function PosPaystackCallbackPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref;
  const result = await resolvePayment(reference);

  return (
    <div className="pos-fullscreen-message" role="status">
      {result.state === "success" ? (
        <>
          <h1>Payment received</h1>
          <p>
            {result.orderNumber} — {formatMoney(result.total)}. You can close this tab and go back to the register.
          </p>
        </>
      ) : (
        <>
          <h1>Payment not confirmed</h1>
          <p>{result.message} You can close this tab and try again from the register.</p>
        </>
      )}
    </div>
  );
}

type ResolvedPayment = { state: "success"; orderNumber: string; total: number } | { state: "failed"; message: string };

async function resolvePayment(reference: string | undefined): Promise<ResolvedPayment> {
  if (!reference) {
    return { state: "failed", message: "No payment reference was provided." };
  }

  const context = getCommerceServerContext();
  if (!context) {
    return { state: "failed", message: "Payment confirmation isn't available right now." };
  }

  try {
    const order = await context.repo.findOrderByIdempotencyKey(reference);
    if (!order) {
      return { state: "failed", message: "We couldn't find that sale." };
    }

    if (order.paymentStatus === "PAID") {
      return { state: "success", orderNumber: order.orderNumber, total: order.total };
    }

    const verified = await verifyPaystackTransaction(reference);
    if (verified.status !== "success") {
      return { state: "failed", message: "Paystack reported this payment did not complete." };
    }

    const confirmed = await confirmPaystackPayment(context, {
      orderId: order.id,
      providerReference: reference,
      channel: verified.channel
    });

    return { state: "success", orderNumber: confirmed.order.orderNumber, total: confirmed.order.total };
  } catch {
    return { state: "failed", message: "Something went wrong confirming this payment." };
  }
}
