"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminActionState } from "@/lib/admin/product-form";

type DeleteOrderButtonProps = {
  orderId: string;
  orderNumber: string;
  disabled?: boolean;
  action: (orderId: string) => Promise<AdminActionState>;
};

export function DeleteOrderButton({ orderId, orderNumber, disabled, action }: DeleteOrderButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [typedNumber, setTypedNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const matches = typedNumber.trim() === orderNumber;

  async function handleDelete() {
    setBusy(true);
    setError("");

    const result = await action(orderId);
    if (result.status === "success") {
      router.refresh();
    } else {
      setError(result.message);
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <div className="admin-danger-zone">
        <button
          className="admin-action danger small"
          disabled={disabled}
          onClick={() => setConfirming(true)}
          type="button"
        >
          Delete order
        </button>
      </div>
    );
  }

  return (
    <div className="admin-danger-zone">
      <div className="admin-danger-zone-confirm">
        <p>
          This permanently deletes order <strong>{orderNumber}</strong> and its payment record. This can&apos;t be
          undone. Type the order number to confirm.
        </p>
        <input
          disabled={busy}
          onChange={(event) => setTypedNumber(event.target.value)}
          placeholder={orderNumber}
          value={typedNumber}
        />
        {error ? <p className="form-error">{error}</p> : null}
        <div className="admin-danger-zone-actions">
          <button className="admin-action danger small" disabled={!matches || busy} onClick={handleDelete} type="button">
            {busy ? "Deleting..." : "Confirm delete"}
          </button>
          <button
            className="admin-action ghost small"
            disabled={busy}
            onClick={() => {
              setConfirming(false);
              setTypedNumber("");
              setError("");
            }}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
