"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { AdminActionState } from "@/lib/admin/product-form";

type SelectionContextValue = {
  selected: Set<string>;
  toggle: (orderId: string) => void;
  clear: () => void;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error("Orders selection components must be used inside OrdersSelectionProvider.");
  }
  return context;
}

// Only ever holds order ids (plain strings) client-side — never the order
// objects themselves, which carry raw Firestore Timestamp fields that can't
// safely cross the server/client component boundary.
export function OrdersSelectionProvider({
  allOrderIds,
  children
}: {
  allOrderIds: string[];
  children: ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(orderId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }

  function clear() {
    setSelected(new Set());
  }

  return <SelectionContext.Provider value={{ selected, toggle, clear }}>{children}</SelectionContext.Provider>;
}

export function OrderSelectCheckbox({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const { selected, toggle } = useSelection();

  return (
    <span className="order-row-select">
      <input
        aria-label={`Select ${orderNumber}`}
        checked={selected.has(orderId)}
        onChange={() => toggle(orderId)}
        type="checkbox"
      />
    </span>
  );
}

export function OrdersBulkBar({
  disabled,
  allOrderIds,
  orderNumberById,
  deleteOrdersAction
}: {
  disabled: boolean;
  allOrderIds: string[];
  orderNumberById: Record<string, string>;
  deleteOrdersAction: (orderIds: string[]) => Promise<AdminActionState>;
}) {
  const router = useRouter();
  const { selected, toggle, clear } = useSelection();
  const [confirming, setConfirming] = useState(false);
  const [typedConfirm, setTypedConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const allSelected = allOrderIds.length > 0 && allOrderIds.every((id) => selected.has(id));

  function toggleAll() {
    if (allSelected) {
      clear();
    } else {
      for (const id of allOrderIds) {
        if (!selected.has(id)) toggle(id);
      }
    }
  }

  const selectedNumbers = useMemo(
    () => Array.from(selected).map((id) => orderNumberById[id] ?? id),
    [selected, orderNumberById]
  );

  async function handleBulkDelete() {
    setBusy(true);
    setError("");

    const result = await deleteOrdersAction(Array.from(selected));
    if (result.status === "success") {
      setConfirming(false);
      clear();
      router.refresh();
    } else {
      setError(result.message);
    }
    setBusy(false);
  }

  if (allOrderIds.length === 0) {
    return null;
  }

  return (
    <>
      <label className="admin-select-all-row">
        <input checked={allSelected} onChange={toggleAll} type="checkbox" />
        Select all {allOrderIds.length} order{allOrderIds.length === 1 ? "" : "s"}
      </label>

      {selected.size > 0 && !confirming ? (
        <div className="admin-bulk-action-bar">
          <span>
            <strong>{selected.size}</strong> order{selected.size === 1 ? "" : "s"} selected
          </span>
          <div className="admin-bulk-action-bar-actions">
            <button className="admin-action ghost small" onClick={clear} type="button">
              Clear
            </button>
            <button
              className="admin-action danger small"
              disabled={disabled}
              onClick={() => {
                setConfirming(true);
                setTypedConfirm("");
                setError("");
              }}
              type="button"
            >
              Delete selected
            </button>
          </div>
        </div>
      ) : null}

      {confirming ? (
        <div className="admin-bulk-confirm">
          <p>
            This permanently deletes <strong>{selected.size}</strong> order{selected.size === 1 ? "" : "s"} and their
            payment records. This can&apos;t be undone.
          </p>
          <ul className="admin-bulk-confirm-list">
            {selectedNumbers.map((number, index) => (
              <li key={index}>{number}</li>
            ))}
          </ul>
          <p>
            Type <strong>DELETE</strong> to confirm.
          </p>
          <input
            disabled={busy}
            onChange={(event) => setTypedConfirm(event.target.value)}
            placeholder="DELETE"
            value={typedConfirm}
          />
          {error ? <p className="form-error">{error}</p> : null}
          <div className="admin-danger-zone-actions">
            <button
              className="admin-action danger small"
              disabled={typedConfirm.trim() !== "DELETE" || busy}
              onClick={handleBulkDelete}
              type="button"
            >
              {busy ? "Deleting..." : `Confirm delete (${selected.size})`}
            </button>
            <button
              className="admin-action ghost small"
              disabled={busy}
              onClick={() => {
                setConfirming(false);
                setError("");
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
