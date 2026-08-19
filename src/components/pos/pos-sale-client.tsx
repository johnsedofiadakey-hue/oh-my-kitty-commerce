"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { formatMoney } from "@/lib/commerce/format";
import type { StorefrontProductView } from "@/lib/storefront/catalogue";
import {
  enqueueSale,
  listPendingSales,
  onQueueChanged,
  replayPendingSales,
  type PendingAction
} from "@/lib/pos/offline-queue";
import { PosRecentSales, type RecentPosSale } from "@/components/pos/pos-reversal-panel";

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
  orderNumber: string | null;
  total: number;
  pending: boolean;
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
  const [recentSales, setRecentSales] = useState<RecentPosSale[]>([]);
  const [pendingSales, setPendingSales] = useState<PendingAction[]>([]);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const canSell = source === "live" && shift?.status === "OPEN";
  const pendingCount = pendingSales.filter((sale) => sale.status === "pending").length;
  const failedSales = pendingSales.filter((sale) => sale.status === "failed");

  const refreshPendingSales = useCallback(() => {
    listPendingSales().then(setPendingSales).catch(() => undefined);
  }, []);

  const attemptSync = useCallback(async () => {
    // Queued sales are already counted in shiftSales optimistically (see
    // completeSale) — a successful replay just confirms that total was
    // right. A permanently failed one (e.g. sold out by the time it synced)
    // is surfaced in the "Sync issues" list below for staff to reconcile by
    // hand rather than silently rewriting the running cash total.
    const result = await replayPendingSales();
    refreshPendingSales();
    return result;
  }, [refreshPendingSales]);

  useEffect(() => {
    refreshPendingSales();
    void attemptSync();

    function handleOnline() {
      setIsOnline(true);
      void attemptSync();
    }

    function handleOffline() {
      setIsOnline(false);
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        void attemptSync();
      }
    }

    const unsubscribeQueue = onQueueChanged(refreshPendingSales);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      unsubscribeQueue();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [attemptSync, refreshPendingSales]);
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
      setRecentSales([]);
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

  function handleReversed(orderId: string, mode: "REFUND" | "VOID") {
    setRecentSales((current) =>
      current.map((sale) => (sale.orderId === orderId ? { ...sale, reversed: mode } : sale))
    );
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

    if (!shift) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    const saleId = crypto.randomUUID();
    const saleRequest = {
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
      posShiftId: shift.id
    };
    const estimatedTotal = subtotal;

    function settleLocally(orderId: string | null, orderNumber: string | null, total: number, pending: boolean) {
      setReceipt({ changeDue, orderNumber, total, pending });
      setShiftSales((current) => ({
        cash: current.cash + (paymentMethod === "cash" ? total : 0),
        count: current.count + 1,
        revenue: current.revenue + total
      }));
      if (orderId && orderNumber) {
        setRecentSales((current) => [{ orderId, orderNumber, total }, ...current].slice(0, 8));
      }
      setCart([]);
      setCashReceived("");
      setCustomerName("");
      setCustomerPhone("");
    }

    try {
      const response = await fetch("/api/pos/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...saleRequest, idempotencyKey: saleId })
      });
      const payload = (await response.json()) as {
        message?: string;
        orderId?: string;
        orderNumber?: string;
        total?: number;
      };

      if (!response.ok || !payload.orderId || !payload.orderNumber || typeof payload.total !== "number") {
        // The server saw the request and rejected it (bad input, out of
        // stock, shift closed) — retrying the identical request offline
        // would just fail the same way, so this is a real error, not an
        // offline condition.
        throw new Error(payload.message ?? "POS sale failed.");
      }

      settleLocally(payload.orderId, payload.orderNumber, payload.total, false);
    } catch (error) {
      if (error instanceof TypeError) {
        // fetch() itself threw — a network-level failure, not a server
        // response, which is the signal that we're actually offline.
        // The order doesn't exist server-side yet, so it can't be
        // refunded/voided from here until sync assigns it a real orderId.
        await enqueueSale(saleId, saleRequest);
        refreshPendingSales();
        settleLocally(null, null, estimatedTotal, true);
      } else {
        setErrorMessage(error instanceof Error ? error.message : "POS sale failed.");
      }
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
      <button
        aria-expanded={cartSheetOpen}
        className="pos-cart-summary-bar"
        onClick={() => setCartSheetOpen((current) => !current)}
        type="button"
      >
        <span>
          {cart.length} item{cart.length === 1 ? "" : "s"}
          {pendingCount > 0 ? ` · ${pendingCount} pending sync` : ""}
        </span>
        <strong>{formatMoney(subtotal)}</strong>
        <span aria-hidden="true" className="pos-cart-summary-chevron">
          {cartSheetOpen ? "Close" : "View bag"}
        </span>
      </button>
      {cartSheetOpen ? (
        <button
          aria-label="Close cart"
          className="admin-nav-backdrop pos-cart-backdrop"
          onClick={() => setCartSheetOpen(false)}
          type="button"
        />
      ) : null}
      <aside
        aria-label="POS cart"
        className={cartSheetOpen ? "pos-cart open" : "pos-cart"}
      >
        <div className="pos-cart-heading">
          <h2 className="app-title">Cart</h2>
          <div className="pos-connection-status">
            <span className={isOnline ? "status-pill online" : "status-pill offline"}>
              {isOnline ? "Online" : "Offline"}
            </span>
            {pendingCount > 0 ? (
              <span className="status-pill pending">{pendingCount} pending sync</span>
            ) : null}
          </div>
        </div>
        {failedSales.length > 0 ? (
          <div className="admin-alert danger" role="alert">
            <strong>{failedSales.length} sale{failedSales.length === 1 ? "" : "s"} couldn&apos;t sync</strong>
            <ul>
              {failedSales.map((sale) => (
                <li key={sale.id}>{sale.lastError ?? "Sync failed"}</li>
              ))}
            </ul>
            <span>These were made offline but the server rejected them once reconnected — reconcile manually.</span>
          </div>
        ) : null}
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
        <PosRecentSales onReversed={handleReversed} sales={recentSales} />
        {receipt ? (
          <div className={receipt.pending ? "pos-receipt pending" : "pos-receipt"} role="status">
            <span>{receipt.pending ? "Saved offline" : "Receipt"}</span>
            <strong>{receipt.pending ? "Will sync when back online" : receipt.orderNumber}</strong>
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
