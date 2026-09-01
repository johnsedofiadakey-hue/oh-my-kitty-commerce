"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminActionState } from "@/lib/admin/product-form";

type DeleteProductButtonProps = {
  productId: string;
  productTitle: string;
  disabled?: boolean;
  action: (productId: string) => Promise<AdminActionState>;
};

export function DeleteProductButton({ productId, productTitle, disabled, action }: DeleteProductButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [typedTitle, setTypedTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const matches = typedTitle.trim() === productTitle;

  async function handleDelete() {
    setBusy(true);
    setError("");

    const result = await action(productId);
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
          Delete product
        </button>
      </div>
    );
  }

  return (
    <div className="admin-danger-zone">
      <div className="admin-danger-zone-confirm">
        <p>
          This permanently deletes <strong>{productTitle}</strong> and all its variants. This can&apos;t be
          undone. Type the product name to confirm.
        </p>
        <input
          disabled={busy}
          onChange={(event) => setTypedTitle(event.target.value)}
          placeholder={productTitle}
          value={typedTitle}
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
              setTypedTitle("");
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
