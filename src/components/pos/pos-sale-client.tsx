"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { formatMoney } from "@/lib/commerce/format";
import type { StorefrontProductView } from "@/lib/storefront/catalogue";
import {
  enqueueSale,
  listPendingSales,
  onQueueChanged,
  replayPendingSales,
  type PendingAction
} from "@/lib/pos/offline-queue";
import { PosOrdersPanel } from "@/components/pos/pos-orders-panel";
import { AdminSignOutButton } from "@/components/auth/admin-sign-out-button";

type PosSaleClientProps = {
  canRefund: boolean;
  canViewOrders: boolean;
  canVoid: boolean;
  products: StorefrontProductView[];
  source: "live" | "sample";
  sourceMessage?: string;
  staffName: string;
};

type PosLine = StorefrontProductView & {
  quantity: number;
};

type PosReceipt = {
  changeDue: number;
  orderId: string | null;
  orderNumber: string | null;
  total: number;
  pending: boolean;
};

type PaymentMethod = "cash" | "mobile_money" | "card" | "manual_transfer";

type MomoProvider = "mtn" | "vod" | "atl";

const MOMO_PROVIDERS: { value: MomoProvider; label: string }[] = [
  { value: "mtn", label: "MTN Mobile Money" },
  { value: "vod", label: "Vodafone Cash" },
  { value: "atl", label: "AirtelTigo Money" }
];

type MomoStage = "idle" | "waiting" | "failed";

const MOMO_POLL_INTERVAL_MS = 3000;
const MOMO_TIMEOUT_MS = 120_000;

type PosShiftState = {
  id: string;
  openingCash: number;
  status: "OPEN" | "CLOSED";
};

// useSyncExternalStore (not useState+useEffect) so the connectivity pill can
// never disagree with the server-rendered HTML — there's no `navigator` to
// read on the server, and the server snapshot below matches what SSR emits.
function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerOnlineSnapshot() {
  return true;
}

export function PosSaleClient({
  canRefund,
  canViewOrders,
  canVoid,
  products,
  source,
  sourceMessage,
  staffName
}: PosSaleClientProps) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<PosLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [momoProvider, setMomoProvider] = useState<MomoProvider>("mtn");
  const [momoStage, setMomoStage] = useState<MomoStage>("idle");
  const [momoMessage, setMomoMessage] = useState("");
  const [momoElapsedMs, setMomoElapsedMs] = useState(0);
  const [momoReference, setMomoReference] = useState<string | null>(null);
  const momoPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const momoCancelledRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<PosReceipt | null>(null);
  const [shiftBusy, setShiftBusy] = useState(false);
  const [shift, setShift] = useState<PosShiftState | null>(null);
  const [pendingSales, setPendingSales] = useState<PendingAction[]>([]);
  const isOnline = useSyncExternalStore(subscribeToOnlineStatus, getOnlineSnapshot, getServerOnlineSnapshot);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const canSell = source === "live" && shift?.status === "OPEN";
  const pendingCount = pendingSales.filter((sale) => sale.status === "pending").length;
  const failedSales = pendingSales.filter((sale) => sale.status === "failed");

  const refreshPendingSales = useCallback(() => {
    listPendingSales().then(setPendingSales).catch(() => undefined);
  }, []);

  const attemptSync = useCallback(async () => {
    // A successful replay just confirms a queued sale was right. A
    // permanently failed one (e.g. sold out by the time it synced) is
    // surfaced in the "Sync issues" list below for staff to reconcile by
    // hand.
    const result = await replayPendingSales();
    refreshPendingSales();
    return result;
  }, [refreshPendingSales]);

  useEffect(() => {
    refreshPendingSales();
    void attemptSync();

    function handleOnline() {
      void attemptSync();
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        void attemptSync();
      }
    }

    const unsubscribeQueue = onQueueChanged(refreshPendingSales);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      unsubscribeQueue();
      window.removeEventListener("online", handleOnline);
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
      // No manual "opening cash" entry anymore — shifts open silently in the
      // background purely for cash-accountability reporting, so this is
      // always 0. A real opening float still gets recorded via "Closing
      // cash" at end of day, same as before.
      const response = await fetch("/api/pos/shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingCash: 0 })
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
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not open shift.");
    } finally {
      setShiftBusy(false);
    }
  }

  // A shift opens automatically the moment one isn't already running — staff
  // never manually "open" one. autoShiftAttempted guards against retry
  // storms if it fails; it's reset after a successful close (see closeShift)
  // and by the manual "Try again" fallback so a real failure isn't a dead end.
  const autoShiftAttempted = useRef(false);

  useEffect(() => {
    if (source !== "live" || shift?.status === "OPEN" || shiftBusy || autoShiftAttempted.current) {
      return;
    }
    autoShiftAttempted.current = true;
    void openShift();
  }, [source, shift, shiftBusy]);

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

  // Every field a fresh sale should start blank on — reused by both the
  // post-sale reset and the manual "Clear cart" action, so a misring never
  // leaves stale customer/promo/cash-tendered fields behind either way.
  function clearCart() {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setPromoCode("");
    setCashReceived("");
  }

  function stopMomoPolling() {
    if (momoPollRef.current) {
      clearInterval(momoPollRef.current);
      momoPollRef.current = null;
    }
  }

  useEffect(() => stopMomoPolling, []);

  function settleMomoSale(orderId: string, orderNumber: string, total: number) {
    stopMomoPolling();
    setMomoStage("idle");
    setMomoMessage("");
    setMomoElapsedMs(0);
    setMomoReference(null);
    setReceipt({ changeDue: 0, orderId, orderNumber, total, pending: false });
    clearCart();
  }

  async function cancelMomoCharge(reference: string | null) {
    if (!reference) {
      return;
    }

    momoCancelledRef.current = true;
    stopMomoPolling();
    setMomoStage("idle");
    setMomoMessage("");
    setMomoElapsedMs(0);
    setMomoReference(null);
    setSubmitting(false);
    try {
      await fetch(`/api/pos/momo/charge/${encodeURIComponent(reference)}/cancel`, { method: "POST" });
    } catch {
      // Best-effort — the charge will also self-resolve via Paystack's
      // webhook if the customer approves after this point.
    }
  }

  function startMomoPolling(reference: string) {
    momoCancelledRef.current = false;
    setMomoReference(reference);
    let ticks = 0;

    momoPollRef.current = setInterval(async () => {
      if (momoCancelledRef.current) {
        return;
      }

      ticks += 1;
      const elapsed = ticks * MOMO_POLL_INTERVAL_MS;
      setMomoElapsedMs(elapsed);

      if (elapsed >= MOMO_TIMEOUT_MS) {
        stopMomoPolling();
        setMomoStage("failed");
        setMomoMessage("The customer didn't approve in time. Try again, or pick a different payment method.");
        setSubmitting(false);
        void cancelMomoCharge(reference);
        return;
      }

      try {
        const response = await fetch(`/api/pos/momo/charge/${encodeURIComponent(reference)}`);
        const payload = (await response.json()) as {
          status?: "success" | "pending" | "failed" | "cancelled";
          orderId?: string;
          orderNumber?: string;
          total?: number;
          message?: string;
        };

        if (payload.status === "success" && payload.orderId && payload.orderNumber) {
          settleMomoSale(payload.orderId, payload.orderNumber, payload.total ?? subtotal);
          setSubmitting(false);
        } else if (payload.status === "failed" || payload.status === "cancelled") {
          stopMomoPolling();
          setMomoStage("failed");
          setMomoMessage(payload.message ?? "The payment did not go through.");
          setSubmitting(false);
        }
        // "pending" — keep polling, no state change needed beyond the elapsed tick above.
      } catch {
        // A transient network hiccup while polling isn't fatal — the next
        // tick tries again; only the overall timeout above gives up.
      }
    }, MOMO_POLL_INTERVAL_MS);
  }

  async function startMomoCharge() {
    if (!shift) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setMomoStage("waiting");
    setMomoMessage("Starting charge...");
    setMomoElapsedMs(0);

    try {
      const response = await fetch("/api/pos/momo/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: customerName, phone: customerPhone },
          items: cart.map((line) => ({
            productId: line.id,
            variantId: line.variantId,
            quantity: line.quantity
          })),
          provider: momoProvider,
          posShiftId: shift.id,
          promoCode: promoCode.trim() || undefined,
          idempotencyKey: crypto.randomUUID()
        })
      });
      const payload = (await response.json()) as {
        message?: string;
        orderId?: string;
        orderNumber?: string;
        total?: number;
        reference?: string;
        chargeStatus?: string;
        displayText?: string | null;
      };

      if (!response.ok || !payload.orderId || !payload.orderNumber || !payload.reference) {
        throw new Error(payload.message ?? "Could not start the mobile money charge.");
      }

      if (payload.chargeStatus === "success") {
        settleMomoSale(payload.orderId, payload.orderNumber, payload.total ?? subtotal);
        setSubmitting(false);
        return;
      }

      setMomoMessage(payload.displayText || "Ask the customer to check their phone and approve the payment.");
      startMomoPolling(payload.reference);
    } catch (error) {
      setMomoStage("failed");
      setMomoMessage(error instanceof Error ? error.message : "Could not start the mobile money charge.");
      setSubmitting(false);
    }
  }

  async function completeSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!shift) {
      return;
    }

    if (paymentMethod === "mobile_money") {
      void startMomoCharge();
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
      posShiftId: shift.id,
      promoCode: promoCode.trim() || undefined
    };
    const estimatedTotal = subtotal;

    function settleLocally(orderId: string | null, orderNumber: string | null, total: number, pending: boolean) {
      setReceipt({ changeDue, orderId, orderNumber, total, pending });
      clearCart();
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
        <div className="page-heading">
          <div>
            <h1 className="app-title">POS sale</h1>
            <p className="app-subtitle">Search, tap products, take payment, and issue a receipt.</p>
          </div>
          {canViewOrders ? (
            <div className="page-heading-actions">
              <button className="admin-action ghost" onClick={() => setOrdersOpen(true)} type="button">
                Orders
              </button>
            </div>
          ) : null}
        </div>
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
          <div className="pos-cart-heading-title">
            <h2 className="app-title">Cart</h2>
            {cart.length > 0 ? (
              <button
                className="pos-clear-cart-button"
                onClick={() => {
                  if (window.confirm(`Clear all ${cart.length} item${cart.length === 1 ? "" : "s"} from the cart?`)) {
                    clearCart();
                  }
                }}
                type="button"
              >
                Clear
              </button>
            ) : null}
          </div>
          <div className="pos-connection-status">
            <span className={isOnline ? "status-pill online" : "status-pill offline"}>
              {isOnline ? "Online" : "Offline"}
            </span>
            {pendingCount > 0 ? (
              <span className="status-pill pending">{pendingCount} pending sync</span>
            ) : null}
          </div>
        </div>
        <div className="pos-staff-bar">
          <span>Signed in as {staffName}</span>
          <AdminSignOutButton />
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
        {/* Shifts open silently in the background purely for
            cash-accountability reporting — nothing shift-related shows up
            during normal operation on purpose (this is a fast-moving
            customer-service counter, not a back-office tool). This panel
            only appears at all if that silent open genuinely fails, so
            there's still a way to recover instead of a dead page. */}
        {errorMessage && (!shift || shift.status !== "OPEN") && !shiftBusy && source === "live" ? (
          <section className="pos-shift-panel" aria-label="POS shift">
            <p className="form-error">{errorMessage}</p>
            <button
              className="pos-secondary-button"
              onClick={() => {
                autoShiftAttempted.current = false;
                void openShift();
              }}
              type="button"
            >
              Try again
            </button>
          </section>
        ) : null}
        {receipt ? (
          <div className={receipt.pending ? "pos-receipt pending" : "pos-receipt"} role="status">
            <span>{receipt.pending ? "Saved offline" : "Receipt"}</span>
            <strong>{receipt.pending ? "Will sync when back online" : receipt.orderNumber}</strong>
            <small>{formatMoney(receipt.total)}</small>
            {receipt.changeDue > 0 ? <small>Change {formatMoney(receipt.changeDue)}</small> : null}
            {receipt.orderId ? (
              <a
                className="admin-action ghost small"
                href={`/receipt/order/${receipt.orderId}`}
                rel="noopener"
                target="_blank"
              >
                Print receipt
              </a>
            ) : null}
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
              placeholder={paymentMethod === "mobile_money" ? "024 000 0000" : "Optional"}
              required={paymentMethod === "mobile_money"}
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
              <option disabled={!isOnline} value="mobile_money">
                Mobile money{isOnline ? "" : " (needs a connection)"}
              </option>
              <option value="card">Card</option>
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
          {paymentMethod === "mobile_money" ? (
            <label className="admin-field">
              <span>Network</span>
              <select
                onChange={(event) => setMomoProvider(event.target.value as MomoProvider)}
                value={momoProvider}
              >
                {MOMO_PROVIDERS.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="admin-field">
            <span>Promo code (optional)</span>
            <input
              onChange={(event) => setPromoCode(event.target.value)}
              placeholder="e.g. WELCOME10"
              value={promoCode}
            />
          </label>
          <div className="pos-total">
            <span>Total</span>
            <strong>{formatMoney(subtotal)}</strong>
          </div>
          {momoStage === "waiting" ? (
            <div className="pos-momo-waiting" role="status">
              <span className="pos-momo-spinner" aria-hidden="true" />
              <strong>{momoMessage}</strong>
              <span>{customerPhone}</span>
              <small>{Math.max(0, Math.round((MOMO_TIMEOUT_MS - momoElapsedMs) / 1000))}s left</small>
              <button
                className="pos-secondary-button"
                onClick={() => void cancelMomoCharge(momoReference)}
                type="button"
              >
                Cancel
              </button>
            </div>
          ) : null}
          {momoStage === "failed" ? <p className="form-error">{momoMessage}</p> : null}
          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          {source === "live" && !canSell && !errorMessage ? (
            <p className="pos-hint">Setting up…</p>
          ) : null}
          <button
            className="checkout-button"
            disabled={!canSell || submitting || cart.length === 0 || momoStage === "waiting"}
            type="submit"
          >
            {momoStage === "waiting"
              ? "Waiting for customer"
              : submitting
                ? "Completing sale"
                : "Complete sale"}
          </button>
        </form>
      </aside>
      <PosOrdersPanel
        canRefund={canRefund}
        canViewOrders={canViewOrders}
        canVoid={canVoid}
        onClose={() => setOrdersOpen(false)}
        open={ordersOpen}
        shiftId={shift?.id ?? null}
      />
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
