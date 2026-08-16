"use client";

import { useMemo, useState, type FormEvent } from "react";
import { formatMoney } from "@/lib/commerce/format";
import type { StorefrontProductView } from "@/lib/storefront/catalogue";

type PosSaleClientProps = {
  products: StorefrontProductView[];
  source: "live" | "sample";
  sourceMessage?: string;
};

type PosLine = StorefrontProductView & {
  quantity: number;
};

type PosReceipt = {
  changeDue: number;
  orderNumber: string;
  total: number;
};

type PaymentMethod = "cash" | "mobile_money" | "manual_transfer";

type PosShiftState = {
  id: string;
  openingCash: number;
  status: "OPEN" | "CLOSED";
  expectedCash?: number;
  difference?: number;
};

export function PosSaleClient({ products, source, sourceMessage }: PosSaleClientProps) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<PosLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<PosReceipt | null>(null);
  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [shiftBusy, setShiftBusy] = useState(false);
  const [shift, setShift] = useState<PosShiftState | null>(null);
  const [shiftSales, setShiftSales] = useState({ count: 0, revenue: 0, cash: 0 });
  const canSell = source === "live" && shift?.status === "OPEN";
  const normalizedQuery = query.trim().toLowerCase();
  const visibleProducts = useMemo(
    () =>
      products.filter((product) =>
        [
          product.title,
          product.sku,
          product.variantTitle,
          product.primaryCategory,
          ...product.categoryLabels
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      ),
    [normalizedQuery, products]
  );
  const subtotal = cart.reduce((total, line) => total + line.price * line.quantity, 0);
  const amountReceived = paymentMethod === "cash" ? parseMoneyInput(cashReceived) : undefined;
  const cashReceivedMinor = amountReceived ?? 0;
  const changeDue =
    paymentMethod === "cash" && cashReceivedMinor > subtotal ? cashReceivedMinor - subtotal : 0;

  async function openShift() {
    setShiftBusy(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/pos/shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openingCash: parseMoneyInput(openingCash) ?? 0
        })
      });
      const payload = (await response.json()) as {
        id?: string;
        message?: string;
        openingCash?: number;
        status?: PosShiftState["status"];
      };

      if (!response.ok || !payload.id || payload.status !== "OPEN") {
        throw new Error(payload.message ?? "Could not open shift.");
      }

      setShift({
        id: payload.id,
        openingCash: payload.openingCash ?? 0,
        status: "OPEN"
      });
      setShiftSales({ count: 0, revenue: 0, cash: 0 });
      setOpeningCash("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not open shift.");
    } finally {
      setShiftBusy(false);
    }
  }

  async function closeShift() {
    if (!shift) {
      return;
    }

    setShiftBusy(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/pos/shift", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          closingCash: parseMoneyInput(closingCash) ?? 0,
          id: shift.id
        })
      });
      const payload = (await response.json()) as {
        difference?: number;
        expectedCash?: number;
        message?: string;
        status?: PosShiftState["status"];
      };

      if (!response.ok || payload.status !== "CLOSED") {
        throw new Error(payload.message ?? "Could not close shift.");
      }

      setShift({
        ...shift,
        difference: payload.difference,
        expectedCash: payload.expectedCash,
        status: "CLOSED"
      });
      setClosingCash("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not close shift.");
    } finally {
      setShiftBusy(false);
    }
  }

  function addProduct(product: StorefrontProductView) {
    setReceipt(null);
    setCart((current) => {
      const existing = current.find((line) => line.variantId === product.variantId);
      if (!existing) {
        return [...current, { ...product, quantity: 1 }];
      }

      return current.map((line) =>
        line.variantId === product.variantId
          ? { ...line, quantity: Math.min(line.quantity + 1, product.stockAvailable) }
          : line
      );
    });
  }

  function setQuantity(variantId: string, quantity: number) {
    setCart((current) =>
      current
        .map((line) => (line.variantId === variantId ? { ...line, quantity } : line))
        .filter((line) => line.quantity > 0)
    );
  }

  async function completeSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/pos/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountReceived,
          customer: {
            name: customerName,
            phone: customerPhone
          },
          items: cart.map((line) => ({
            productId: line.id,
            variantId: line.variantId,
            quantity: line.quantity
          })),
          paymentMethod,
          posShiftId: shift?.id
        })
      });
      const payload = (await response.json()) as { message?: string; orderNumber?: string; total?: number };

      if (!response.ok || !payload.orderNumber || typeof payload.total !== "number") {
        throw new Error(payload.message ?? "POS sale failed.");
      }

      const orderTotal = payload.total;
      setReceipt({ changeDue, orderNumber: payload.orderNumber, total: orderTotal });
      setShiftSales((current) => ({
        cash: current.cash + (paymentMethod === "cash" ? orderTotal : 0),
        count: current.count + 1,
        revenue: current.revenue + orderTotal
      }));
      setCart([]);
      setCashReceived("");
      setCustomerName("");
      setCustomerPhone("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "POS sale failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <main className="pos-products">
        <h1 className="app-title">POS sale</h1>
        <p className="app-subtitle">Search, tap products, take payment, and issue a receipt.</p>
        {sourceMessage ? (
          <div className="admin-alert" role="status">
            {sourceMessage}
          </div>
        ) : null}
        <label className="pos-search">
          <span className="scene-kicker">Product search</span>
          <input
            className="search-box"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search product, SKU, or category"
            value={query}
          />
        </label>
        <section className="product-grid" aria-label="POS product shortcuts">
          {visibleProducts.map((product) => (
            <button
              className="pos-product"
              disabled={!canSell || product.stockAvailable <= 0}
              key={product.variantId}
              onClick={() => addProduct(product)}
              type="button"
            >
              <strong>{product.title}</strong>
              <span>{product.sku}</span>
              <small>{product.primaryCategory}</small>
              <b>{product.formattedPrice}</b>
              <em>{product.stockAvailable} in stock</em>
            </button>
          ))}
        </section>
      </main>
      <aside className="pos-cart" aria-label="POS cart">
        <h2 className="app-title">Cart</h2>
        <section className="pos-shift-panel" aria-label="POS shift">
          <div className="pos-shift-heading">
            <strong>{shift?.status === "OPEN" ? "Shift open" : "Open shift"}</strong>
            <span>{shift?.id ?? "Required before sale"}</span>
          </div>
          {shift?.status === "OPEN" ? (
            <>
              <div className="pos-shift-stats">
                <span>
                  Sales <strong>{shiftSales.count}</strong>
                </span>
                <span>
                  Revenue <strong>{formatMoney(shiftSales.revenue)}</strong>
                </span>
                <span>
                  Cash <strong>{formatMoney(shift.openingCash + shiftSales.cash)}</strong>
                </span>
              </div>
              <label className="admin-field">
                <span>Closing cash GHS</span>
                <input
                  inputMode="decimal"
                  onChange={(event) => setClosingCash(event.target.value)}
                  placeholder={((shift.openingCash + shiftSales.cash) / 100).toFixed(2)}
                  value={closingCash}
                />
              </label>
              <button
                className="pos-secondary-button"
                disabled={shiftBusy}
                onClick={closeShift}
                type="button"
              >
                {shiftBusy ? "Closing" : "Close shift"}
              </button>
            </>
          ) : (
            <>
              {shift?.status === "CLOSED" ? (
                <div className="pos-receipt compact" role="status">
                  <span>Shift closed</span>
                  <strong>Expected {formatMoney(shift.expectedCash ?? 0)}</strong>
                  <small>Difference {formatMoney(shift.difference ?? 0)}</small>
                </div>
              ) : null}
              <label className="admin-field">
                <span>Opening cash GHS</span>
                <input
                  inputMode="decimal"
                  onChange={(event) => setOpeningCash(event.target.value)}
                  placeholder="0.00"
                  value={openingCash}
                />
              </label>
              <button
                className="pos-secondary-button"
                disabled={source !== "live" || shiftBusy}
                onClick={openShift}
                type="button"
              >
                {shiftBusy ? "Opening" : "Open shift"}
              </button>
            </>
          )}
        </section>
        {receipt ? (
          <div className="pos-receipt" role="status">
            <span>Receipt</span>
            <strong>{receipt.orderNumber}</strong>
            <small>{formatMoney(receipt.total)}</small>
            {receipt.changeDue > 0 ? <small>Change {formatMoney(receipt.changeDue)}</small> : null}
          </div>
        ) : null}
        <div className="pos-cart-lines">
          {cart.length > 0 ? (
            cart.map((line) => (
              <div className="cart-line" key={line.variantId}>
                <div>
                  <strong>{line.title}</strong>
                  <span>{line.variantTitle}</span>
                </div>
                <div className="quantity-stepper">
                  <button
                    aria-label={`Decrease ${line.title}`}
                    onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                    type="button"
                  >
                    -
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    aria-label={`Increase ${line.title}`}
                    onClick={() =>
                      setQuantity(line.variantId, Math.min(line.quantity + 1, line.stockAvailable))
                    }
                    type="button"
                  >
                    +
                  </button>
                </div>
                <strong>{formatMoney(line.price * line.quantity)}</strong>
              </div>
            ))
          ) : (
            <div className="cart-line">
              <strong>No items</strong>
              <span>Scan or tap products to begin.</span>
            </div>
          )}
        </div>
        <form className="pos-payment-form" onSubmit={completeSale}>
          <label className="admin-field">
            <span>Customer name</span>
            <input
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Optional"
              value={customerName}
            />
          </label>
          <label className="admin-field">
            <span>Customer phone</span>
            <input
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder="Optional"
              value={customerPhone}
            />
          </label>
          <label className="admin-field">
            <span>Payment</span>
            <select
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              value={paymentMethod}
            >
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile money</option>
              <option value="manual_transfer">Manual transfer</option>
            </select>
          </label>
          {paymentMethod === "cash" ? (
            <label className="admin-field">
              <span>Cash received GHS</span>
              <input
                inputMode="decimal"
                min="0"
                onChange={(event) => setCashReceived(event.target.value)}
                placeholder={(subtotal / 100).toFixed(2)}
                value={cashReceived}
              />
            </label>
          ) : null}
          <div className="pos-total">
            <span>Total</span>
            <strong>{formatMoney(subtotal)}</strong>
          </div>
          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          {source === "live" && !canSell ? (
            <p className="pos-hint">Open a shift before completing POS sales.</p>
          ) : null}
          <button
            className="checkout-button"
            disabled={!canSell || submitting || cart.length === 0}
            type="submit"
          >
            {submitting ? "Completing sale" : "Complete sale"}
          </button>
        </form>
      </aside>
    </>
  );
}

function parseMoneyInput(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : undefined;
}
