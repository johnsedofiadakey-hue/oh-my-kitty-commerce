"use client";

import Link from "next/link";
import type { Route } from "next";
import { useSyncExternalStore } from "react";
import { formatMoney } from "@/lib/commerce/format";
import {
  getOrderHistory,
  getServerOrderHistorySnapshot,
  onOrderHistoryChanged,
  removeOrderFromHistory
} from "@/lib/storefront/order-history";

export function OrderHistoryClient() {
  const orders = useSyncExternalStore(onOrderHistoryChanged, getOrderHistory, getServerOrderHistorySnapshot);

  function remove(orderNumber: string) {
    removeOrderFromHistory(orderNumber);
  }

  if (orders.length === 0) {
    return (
      <div className="cart-surface cart-empty">
        <span className="scene-kicker">Your orders</span>
        <h1>Nothing saved on this device yet.</h1>
        <p>Orders you place in this browser are saved here automatically. Already have an order number?</p>
        <Link className="portal-cta" href="/track">
          <span>Track an order</span>
          <i aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-surface">
      <div className="cart-heading">
        <div>
          <span className="scene-kicker">Your orders</span>
          <h1>Orders on this device</h1>
        </div>
      </div>
      <p>Saved only in this browser, not tied to an account — clearing your browser data clears this list too.</p>
      <div className="stack-list">
        {orders.map((order) => (
          <div className="stack-row" key={order.orderNumber}>
            <strong>{order.orderNumber}</strong>
            <span>
              {new Date(order.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric"
              })}{" "}
              · {formatMoney(order.total)}
            </span>
            <div className="stack-row-actions">
              <Link className="portal-link" href={`/track?order=${encodeURIComponent(order.orderNumber)}` as Route}>
                Track
              </Link>
              <button className="text-button" onClick={() => remove(order.orderNumber)} type="button">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
