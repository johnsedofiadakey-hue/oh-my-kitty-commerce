import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ClearCartOnMount } from "@/components/storefront/clear-cart-on-mount";
import { confirmPaystackPayment } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";
import { formatMoney } from "@/lib/commerce/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmation",
  robots: { index: false, follow: false }
};

type PageProps = {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
};

export default async function PaystackCallbackPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref;

  const result = await resolvePayment(reference);

  return (
    <main className="cart-page">
      <div className="cart-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/petals.svg" />
      </div>
      <header className="shop-header transactional-header">
        <Link className="brand-lockup" href="/">
          <span aria-hidden="true" className="brand-lockup-icon">
            <Image
              alt=""
              fill
              priority
              sizes="40px"
              src="/brand/oh-my-kitty-logo.jpeg"
              style={{ objectFit: "cover", transform: "scale(2) translate(-2%, -10%)" }}
            />
          </span>
          <span className="brand-lockup-text">
            <strong>Oh My Kitty</strong>
            <small>intimate care</small>
          </span>
        </Link>
      </header>
      <section className="cart-surface">
        {result.state === "success" ? (
          <>
            <ClearCartOnMount />
            <span className="scene-kicker">Order confirmed</span>
            <h1>{result.orderNumber}</h1>
            <p>Total: {formatMoney(result.total)}</p>
            <p>Your payment was verified with Paystack and your order is confirmed.</p>
          </>
        ) : (
          <>
            <span className="scene-kicker">Payment not confirmed</span>
            <h1>We couldn&apos;t confirm that payment.</h1>
            <p>{result.message}</p>
            <p>Your cart has not been cleared — you can safely try again.</p>
          </>
        )}
        <Link className="portal-cta" href={result.state === "success" ? "/shop" : "/checkout"}>
          <span>{result.state === "success" ? "Continue shopping" : "Back to checkout"}</span>
          <i aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}

type ResolvedPayment =
  | { state: "success"; orderNumber: string; total: number }
  | { state: "failed"; message: string };

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
      return { state: "failed", message: "We couldn't find that order." };
    }

    if (order.paymentStatus === "PAID") {
      return { state: "success", orderNumber: order.orderNumber, total: order.total };
    }

    const verified = await verifyPaystackTransaction(reference);
    if (verified.status !== "success") {
      return {
        state: "failed",
        message: "Paystack reported this payment did not complete. Go back to checkout to try again."
      };
    }

    const confirmed = await confirmPaystackPayment(context, {
      orderId: order.id,
      providerReference: reference,
      channel: verified.channel
    });

    return { state: "success", orderNumber: confirmed.order.orderNumber, total: confirmed.order.total };
  } catch {
    return { state: "failed", message: "Something went wrong confirming your payment." };
  }
}
