"use client";

import { useState, type FormEvent } from "react";
import { PosRecentSales, type RecentPosSale } from "@/components/pos/pos-reversal-panel";

type SearchedOrder = {
  id: string;
  orderNumber: string;
  paymentStatus: string;
  status: string;
  total: number;
  customerName: string | null;
};

export function PosOrderLookup() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RecentPosSale[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch(`/api/pos/orders?q=${encodeURIComponent(query.trim())}`);
      const payload = (await response.json().catch(() => null)) as
        | { orders?: SearchedOrder[]; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Search failed.");
      }

      setResults(
        (payload?.orders ?? []).map((order) => ({
          orderId: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          reversed:
            order.paymentStatus === "REFUNDED"
              ? order.status === "CANCELLED"
                ? "VOID"
                : "REFUND"
              : undefined
        }))
      );
      setSearched(true);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Search failed.");
    } finally {
      setBusy(false);
    }
  }

  function handleReversed(orderId: string, mode: "REFUND" | "VOID") {
    setResults((current) =>
      current.map((sale) => (sale.orderId === orderId ? { ...sale, reversed: mode } : sale))
    );
  }

  return (
    <section className="pos-shift-panel" aria-label="Order lookup">
      <div className="pos-shift-heading">
        <strong>Find a receipt</strong>
        <span>Order number, name, or phone</span>
      </div>
      <form className="pos-lookup-form" onSubmit={search}>
        <input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="OMK-... or 024..."
          value={query}
        />
        <button className="pos-secondary-button" disabled={busy || !query.trim()} type="submit">
          {busy ? "Searching" : "Search"}
        </button>
      </form>
      {error ? <p className="form-error">{error}</p> : null}
      {searched && results.length === 0 && !error ? (
        <p className="pos-hint">No orders matched &ldquo;{query}&rdquo;.</p>
      ) : null}
      <PosRecentSales bare onReversed={handleReversed} sales={results} />
    </section>
  );
}
