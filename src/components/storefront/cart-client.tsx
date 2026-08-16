"use client";

import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  clearCartLines,
  onCartChanged,
  readCartLines,
  writeCartLines,
  type CartLine
} from "@/components/storefront/add-to-bag-button";
import { formatMoney } from "@/lib/commerce/format";

const serverCartSnapshot: CartLine[] = [];
const deliveryOptions = [
  { label: "Pickup", value: "pickup", fee: 0 },
  { label: "Accra delivery", value: "accra", fee: 2000 },
  { label: "Nationwide delivery", value: "nationwide", fee: 3500 }
] as const;
type DeliveryOptionValue = (typeof deliveryOptions)[number]["value"];

type CheckoutState = {
  customerName: string;
  email: string;
  phone: string;
  delivery: DeliveryOptionValue;
  paymentMethod: "manual_transfer" | "mobile_money" | "cash";
};

type SubmittedOrder = {
  orderNumber: string;
  total: number;
};

export function CartClient() {
  const lines = useSyncExternalStore(subscribeToCart, readCartLines, getServerCartSnapshot);
  const [checkout, setCheckout] = useState<CheckoutState>({
    customerName: "",
    email: "",
    phone: "",
    delivery: "pickup",
    paymentMethod: "mobile_money"
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedOrder, setSubmittedOrder] = useState<SubmittedOrder | null>(null);
  const selectedDelivery = deliveryOptions.find((option) => option.value === checkout.delivery);
  const deliveryTotal = selectedDelivery?.fee ?? 0;
  const subtotal = useMemo(
    () => lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0),
    [lines]
  );
  const total = subtotal + deliveryTotal;

  function updateQuantity(variantId: string, quantity: number) {
    const nextLines = lines
      .map((line) => (line.variantId === variantId ? { ...line, quantity } : line))
      .filter((line) => line.quantity > 0);

    writeCartLines(nextLines);
  }

  function clearCart() {
    clearCartLines();
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: checkout.customerName,
            email: checkout.email,
            phone: checkout.phone
          },
          deliveryTotal,
          items: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity
          })),
          paymentMethod: checkout.paymentMethod
        })
      });
      const payload = (await response.json()) as { message?: string; orderNumber?: string; total?: number };

      if (!response.ok || !payload.orderNumber || typeof payload.total !== "number") {
        throw new Error(payload.message ?? "Checkout failed.");
      }

      setSubmittedOrder({ orderNumber: payload.orderNumber, total: payload.total });
      clearCartLines();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedOrder) {
    return (
      <section className="cart-surface">
        <span className="scene-kicker">Order received</span>
        <h1>{submittedOrder.orderNumber}</h1>
        <p>Total: {formatMoney(submittedOrder.total)}</p>
        <p>Payment is marked for manual confirmation until the live payment provider is connected.</p>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="cart-surface">
        <h1>Your bag is empty.</h1>
        <p>Products added from the shop will appear here.</p>
      </section>
    );
  }

  return (
    <section className="cart-surface">
      <div className="cart-heading">
        <div>
          <span className="scene-kicker">Bag</span>
          <h1>Your care edit</h1>
        </div>
        <button className="text-button" onClick={clearCart} type="button">
          Clear
        </button>
      </div>
      <div className="cart-lines">
        {lines.map((line) => (
          <article className="cart-item" key={line.variantId}>
            <div>
              <strong>{line.productTitle}</strong>
              <span>{line.variantTitle}</span>
              <small>{line.sku}</small>
            </div>
            <div className="quantity-stepper">
              <button
                aria-label={`Decrease ${line.productTitle}`}
                onClick={() => updateQuantity(line.variantId, line.quantity - 1)}
                type="button"
              >
                -
              </button>
              <span>{line.quantity}</span>
              <button
                aria-label={`Increase ${line.productTitle}`}
                onClick={() => updateQuantity(line.variantId, line.quantity + 1)}
                type="button"
              >
                +
              </button>
            </div>
            <strong>{formatMoney(line.unitPrice * line.quantity)}</strong>
          </article>
        ))}
      </div>
      <div className="checkout-summary">
        <div>
          <span>Subtotal</span>
          <strong>{formatMoney(subtotal)}</strong>
        </div>
        <div>
          <span>Delivery</span>
          <strong>{formatMoney(deliveryTotal)}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong>{formatMoney(total)}</strong>
        </div>
        <form className="checkout-form" onSubmit={submitCheckout}>
          <label>
            <span>Name</span>
            <input
              onChange={(event) =>
                setCheckout((current) => ({ ...current, customerName: event.target.value }))
              }
              placeholder="Customer name"
              required
              value={checkout.customerName}
            />
          </label>
          <div className="checkout-form-grid">
            <label>
              <span>Phone</span>
              <input
                onChange={(event) =>
                  setCheckout((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="024..."
                required
                value={checkout.phone}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                onChange={(event) =>
                  setCheckout((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="Optional"
                type="email"
                value={checkout.email}
              />
            </label>
          </div>
          <div className="checkout-form-grid">
            <label>
              <span>Delivery</span>
              <select
                onChange={(event) =>
                  setCheckout((current) => ({
                    ...current,
                    delivery: event.target.value as DeliveryOptionValue
                  }))
                }
                value={checkout.delivery}
              >
                {deliveryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} / {formatMoney(option.fee)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Payment</span>
              <select
                onChange={(event) =>
                  setCheckout((current) => ({
                    ...current,
                    paymentMethod: event.target.value as CheckoutState["paymentMethod"]
                  }))
                }
                value={checkout.paymentMethod}
              >
                <option value="mobile_money">Mobile money</option>
                <option value="manual_transfer">Bank/manual transfer</option>
                <option value="cash">Cash on delivery</option>
              </select>
            </label>
          </div>
          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          <button className="checkout-button" disabled={submitting} type="submit">
            {submitting ? "Creating order" : "Place order"}
          </button>
        </form>
      </div>
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
