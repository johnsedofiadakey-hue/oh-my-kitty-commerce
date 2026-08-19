"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatMoney } from "@/lib/commerce/format";

type TrackResult = {
  orderNumber: string;
  channel: string;
  paymentStatus: string;
  fulfilmentStatus: string;
  total: number;
  deliveryTotal: number;
  createdAt: string | null;
  deliveryAddress: string | null;
  items: { productTitle: string; variantTitle: string; quantity: number; mediaUrl: string | null }[];
};

const FULFILMENT_LABEL: Record<string, string> = {
  UNFULFILLED: "Order received",
  PROCESSING: "Being prepared",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  FULFILLED: "Delivered / collected",
  CANCELLED: "Cancelled"
};

export function TrackOrderClient() {
  const searchParams = useSearchParams();
  const prefilledOrder = searchParams.get("order") ?? "";
  const [orderNumber, setOrderNumber] = useState(prefilledOrder);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const autoSubmitted = useRef(false);

  async function track(numberToTrack: string) {
    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: numberToTrack })
      });
      const payload = (await response.json()) as TrackResult & { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Could not find that order.");
      }

      setResult(payload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not find that order.");
    } finally {
      setSubmitting(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void track(orderNumber);
  }

  // A link texted to the customer (e.g. /track?order=OMK-XXXX) should show
  // their order immediately, not make them retype the number they just tapped.
  useEffect(() => {
    if (prefilledOrder && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void track(prefilledOrder);
    }
  }, [prefilledOrder]);

  return (
    <div className="cart-surface">
      <div className="cart-heading">
        <div>
          <span className="scene-kicker">Track order</span>
          <h1>Where&apos;s my order?</h1>
        </div>
      </div>
      <p>Enter the order number from your confirmation text.</p>
      <form className="checkout-form" onSubmit={submit}>
        <label>
          <span>Order number</span>
          <input
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="OMK-..."
            required
            value={orderNumber}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="checkout-cta" disabled={submitting} type="submit">
          <span>{submitting ? "Searching" : "Track order"}</span>
        </button>
      </form>

      {result ? (
        <div className="track-result">
          <div className="track-result-head">
            <strong>{result.orderNumber}</strong>
            <span className="status">{FULFILMENT_LABEL[result.fulfilmentStatus] ?? result.fulfilmentStatus}</span>
          </div>
          {result.createdAt ? (
            <p className="track-result-date">
              Placed{" "}
              {new Date(result.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric"
              })}
            </p>
          ) : null}
          <div className="track-result-items">
            {result.items.map((item, index) => (
              <div className="track-result-item" key={index}>
                <div className="track-result-thumb" aria-hidden="true">
                  {item.mediaUrl ? <Image alt="" fill sizes="56px" src={item.mediaUrl} /> : null}
                </div>
                <div>
                  <strong>{item.productTitle}</strong>
                  <span>
                    {item.variantTitle} × {item.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {result.deliveryAddress ? (
            <div className="track-result-address">
              <span>Delivery address</span>
              <p>{result.deliveryAddress}</p>
            </div>
          ) : null}
          <div className="track-result-total">
            <span>Total</span>
            <strong>{formatMoney(result.total)}</strong>
          </div>
        </div>
      ) : null}
    </div>
  );
}
