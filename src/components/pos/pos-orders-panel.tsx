"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { formatMoney, formatPaymentMethod } from "@/lib/commerce/format";

type PosOrderSummary = {
  id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  status: string;
  customerName: string | null;
  paymentMethod: string | null;
};

async function fetchOrders(params: { q?: string; shiftId?: string }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.shiftId) search.set("shiftId", params.shiftId);

  const response = await fetch(`/api/pos/orders?${search.toString()}`);
  const payload = (await response.json().catch(() => null)) as { orders?: PosOrderSummary[]; message?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? "Couldn't load orders.");
  }

  return payload?.orders ?? [];
}

// Only reachable by deliberately opening this panel from the POS screen —
// never rendered next to the live cart. It is for looking sales up and
// reprinting receipts; every sale is final, so there is nothing to undo here.
export function PosOrdersPanel({
  open,
  onClose,
  shiftId,
  canViewOrders
}: {
  open: boolean;
  onClose: () => void;
  shiftId: string | null;
  canViewOrders: boolean;
}) {
  const [shiftSales, setShiftSales] = useState<PosOrderSummary[]>([]);
  const [shiftBusy, setShiftBusy] = useState(false);
  const [shiftError, setShiftError] = useState("");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PosOrderSummary[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PosOrderSummary | null>(null);

  async function loadShiftSales(id: string) {
    setShiftBusy(true);
    setShiftError("");

    try {
      setShiftSales(await fetchOrders({ shiftId: id }));
    } catch (error) {
      setShiftError(error instanceof Error ? error.message : "Couldn't load this shift's sales.");
    } finally {
      setShiftBusy(false);
    }
  }

  useEffect(() => {
    if (open && shiftId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate fetch-on-open: refetch the shift's sales fresh every time the panel opens, not a derived-state anti-pattern.
      void loadShiftSales(shiftId);
    }
  }, [open, shiftId]);

  if (!open) {
    return null;
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }

    setSearchBusy(true);
    setSearchError("");

    try {
      setSearchResults(await fetchOrders({ q: query.trim() }));
      setSearched(true);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setSearchBusy(false);
    }
  }

  function closeAndReset() {
    setSelectedOrder(null);
    setQuery("");
    setSearchResults([]);
    setSearched(false);
    onClose();
  }

  return (
    <>
      <button aria-label="Close orders" className="pos-orders-backdrop" onClick={closeAndReset} type="button" />
      <aside aria-label="Orders" className="pos-orders-panel">
        <div className="pos-orders-heading">
          <h2 className="app-title">Orders</h2>
          <button className="pos-secondary-button" onClick={closeAndReset} type="button">
            Close
          </button>
        </div>

        {selectedOrder ? (
          <OrderDetail onBack={() => setSelectedOrder(null)} order={selectedOrder} />
        ) : (
          <>
            <form className="pos-lookup-form" onSubmit={search}>
              <input
                onChange={(event) => setQuery(event.target.value)}
                placeholder="OMK-... or 024..."
                value={query}
              />
              <button className="pos-secondary-button" disabled={searchBusy || !query.trim()} type="submit">
                {searchBusy ? "Searching" : "Search"}
              </button>
            </form>
            {searchError ? <p className="form-error">{searchError}</p> : null}
            {searched && searchResults.length === 0 && !searchError ? (
              <p className="pos-hint">No orders matched &ldquo;{query}&rdquo;.</p>
            ) : null}
            {searchResults.length > 0 ? (
              <OrderList onSelect={setSelectedOrder} orders={searchResults} title="Search results" />
            ) : null}

            <div className="pos-orders-shift">
              <strong>This shift</strong>
              {shiftBusy ? <p className="pos-hint">Loading…</p> : null}
              {shiftError ? <p className="form-error">{shiftError}</p> : null}
              {!shiftBusy && !shiftError && shiftSales.length === 0 ? (
                <p className="pos-hint">No sales yet this shift.</p>
              ) : null}
              {shiftSales.length > 0 ? <OrderList onSelect={setSelectedOrder} orders={shiftSales} /> : null}
            </div>

            {canViewOrders ? (
              <Link className="admin-action ghost small" href="/admin/orders">
                Manage all orders →
              </Link>
            ) : null}
          </>
        )}
      </aside>
    </>
  );
}

function OrderList({
  orders,
  onSelect,
  title
}: {
  orders: PosOrderSummary[];
  onSelect: (order: PosOrderSummary) => void;
  title?: string;
}) {
  return (
    <div className="stack-list">
      {title ? <span className="pos-hint">{title}</span> : null}
      {orders.map((order) => (
        <button
          className="stack-row pos-reversal-row pos-order-row"
          key={order.id}
          onClick={() => onSelect(order)}
          type="button"
        >
          <div>
            <strong>{order.orderNumber}</strong>
            <span>{order.customerName ?? "Walk-in customer"}</span>
          </div>
          <div className="pos-order-row-amount">
            <span>{formatMoney(order.total)}</span>
            {order.paymentMethod ? <small>{formatPaymentMethod(order.paymentMethod)}</small> : null}
          </div>
        </button>
      ))}
    </div>
  );
}

function OrderDetail({ order, onBack }: { order: PosOrderSummary; onBack: () => void }) {
  return (
    <div className="pos-order-detail">
      <button className="pos-secondary-button" onClick={onBack} type="button">
        ← Back
      </button>
      <div className="pos-order-detail-summary">
        <strong>{order.orderNumber}</strong>
        <span>{order.customerName ?? "Walk-in customer"}</span>
        <span>
          {formatMoney(order.total)}
          {order.paymentMethod ? ` · ${formatPaymentMethod(order.paymentMethod)}` : ""}
        </span>
      </div>
      <a className="admin-action ghost small" href={`/receipt/order/${order.id}`} rel="noopener" target="_blank">
        View receipt
      </a>
    </div>
  );
}
