"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { onCartChanged, readCartLines, type CartLine } from "@/components/storefront/add-to-bag-button";
import { BagIcon } from "@/components/storefront/icons";
import { formatMoney } from "@/lib/commerce/format";
import type { StorefrontDeliveryOption } from "@/lib/storefront/delivery";

type CheckoutClientProps = {
  deliveryOptions: StorefrontDeliveryOption[];
  paystackEnabled: boolean;
};

type CustomerState = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const serverCartSnapshot: CartLine[] = [];

export function CheckoutClient({ deliveryOptions, paystackEnabled }: CheckoutClientProps) {
  const lines = useSyncExternalStore(subscribeToCart, readCartLines, getServerCartSnapshot);
  const [customer, setCustomer] = useState<CustomerState>({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: ""
  });
  const [deliveryId, setDeliveryId] = useState(deliveryOptions[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const subtotal = useMemo(
    () => lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0),
    [lines]
  );
  const selectedDelivery = deliveryOptions.find((option) => option.id === deliveryId);
  const deliveryFee = selectedDelivery?.fee ?? 0;
  const total = subtotal + deliveryFee;
  const isPickup = selectedDelivery?.type === "PICKUP";

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!paystackEnabled) {
      setErrorMessage("Payments aren't set up yet — check back shortly.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/checkout/paystack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: isPickup ? undefined : customer.address,
            notes: customer.notes || undefined
          },
          deliveryRuleId: deliveryId,
          items: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity
          }))
        })
      });
      const payload = (await response.json()) as {
        message?: string;
        orderNumber?: string;
        total?: number;
        authorizationUrl?: string;
      };

      if (!response.ok || !payload.orderNumber || typeof payload.total !== "number") {
        throw new Error(payload.message ?? "Checkout failed.");
      }

      if (!payload.authorizationUrl) {
        throw new Error("Could not start payment.");
      }

      // Cart is intentionally left intact here — it only clears once
      // Paystack confirms payment on the callback page, never before.
      window.location.href = payload.authorizationUrl;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Checkout failed.");
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <section className="cart-surface cart-empty">
        <span className="scene-kicker">Checkout</span>
        <h1>Your bag is empty.</h1>
        <p>Add something to your bag first, then come back here.</p>
        <Link className="portal-cta" href="/shop">
          <span>Explore care</span>
          <i aria-hidden="true" />
        </Link>
      </section>
    );
  }

  return (
    <section className="cart-surface checkout-surface">
      <div className="cart-heading">
        <div>
          <span className="scene-kicker">Checkout</span>
          <h1>Confirm your order</h1>
        </div>
      </div>

      <div className="checkout-order-summary">
        {lines.map((line) => (
          <article className="cart-item" key={line.variantId}>
            <div className="cart-item-figure" aria-hidden="true">
              {line.imageUrl ? (
                <Image alt="" fill sizes="88px" src={line.imageUrl} />
              ) : (
                <Image alt="" height={40} src="/brand/oh-my-kitty-logo.jpeg" width={40} />
              )}
            </div>
            <div className="cart-item-copy">
              <strong>{line.productTitle}</strong>
              <span>
                {line.variantTitle} × {line.quantity}
              </span>
            </div>
            <div className="cart-item-total">
              <strong>{formatMoney(line.unitPrice * line.quantity)}</strong>
            </div>
          </article>
        ))}
      </div>

      <form className="checkout-form" onSubmit={submitCheckout}>
        <label>
          <span>Your name</span>
          <input
            autoComplete="name"
            onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))}
            placeholder="e.g. Ama Owusu"
            required
            value={customer.name}
          />
        </label>
        <div className="checkout-form-grid">
          <label>
            <span>Phone number</span>
            <input
              autoComplete="tel"
              inputMode="tel"
              onChange={(event) =>
                setCustomer((current) => ({ ...current, phone: event.target.value }))
              }
              placeholder="024 000 0000"
              required
              type="tel"
              value={customer.phone}
            />
          </label>
          <label>
            <span>Email (optional)</span>
            <input
              autoComplete="email"
              inputMode="email"
              onChange={(event) =>
                setCustomer((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="If you'd like a receipt by email"
              type="email"
              value={customer.email}
            />
          </label>
        </div>

        <div>
          <div className="checkout-section-head">
            <span className="checkout-form-label">How do you want it?</span>
            <Link className="checkout-terms-link" href="/delivery">
              See delivery terms
            </Link>
          </div>
          <div className="delivery-option-list" role="radiogroup" aria-label="Delivery method">
            {deliveryOptions.map((option) => (
              <label className={`delivery-option ${deliveryId === option.id ? "active" : ""}`} key={option.id}>
                <input
                  checked={deliveryId === option.id}
                  name="delivery"
                  onChange={() => setDeliveryId(option.id)}
                  type="radio"
                  value={option.id}
                />
                <span className="delivery-option-name">{option.name}</span>
                <span className="delivery-option-meta">{option.estimate ?? ""}</span>
                {option.fee > 0 ? <strong>{option.formattedFee}</strong> : null}
              </label>
            ))}
          </div>
        </div>

        {!isPickup ? (
          <label>
            <span>Where should we bring it?</span>
            <input
              autoComplete="street-address"
              onChange={(event) =>
                setCustomer((current) => ({ ...current, address: event.target.value }))
              }
              placeholder="House number, area, closest landmark"
              required
              value={customer.address}
            />
          </label>
        ) : null}

        <label className="checkout-notes-field">
          <span>Anything we should know? (optional)</span>
          <textarea
            onChange={(event) => setCustomer((current) => ({ ...current, notes: event.target.value }))}
            placeholder="e.g. call before you arrive, gate code, best time to reach you"
            rows={2}
            value={customer.notes}
          />
        </label>

        <div className="checkout-totals">
          <div>
            <span>Subtotal</span>
            <strong>{formatMoney(subtotal)}</strong>
          </div>
          <div>
            <span>Delivery</span>
            <strong>{deliveryFee === 0 ? "Free" : formatMoney(deliveryFee)}</strong>
          </div>
          <div className="checkout-grand-total">
            <span>Total</span>
            <strong>{formatMoney(total)}</strong>
          </div>
        </div>

        {!paystackEnabled ? (
          <p className="checkout-payment-note">
            Payments aren&apos;t set up yet on this environment, so orders can&apos;t be placed here.
          </p>
        ) : (
          <p className="checkout-payment-note">Pay safely with Mobile Money or Card.</p>
        )}

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
        <button className="checkout-cta" disabled={submitting || !paystackEnabled} type="submit">
          <span>{submitting ? "Taking you to payment..." : "Pay now"}</span>
          <BagIcon className="cta-icon" />
        </button>
      </form>
    </section>
  );
}

function subscribeToCart(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  return onCartChanged(listener);
}

function getServerCartSnapshot(): CartLine[] {
  return serverCartSnapshot;
}
