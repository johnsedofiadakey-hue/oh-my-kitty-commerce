"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminActionState } from "@/lib/admin/product-form";

type DeleteMaterialButtonProps = {
  materialId: string;
  materialName: string;
  disabled?: boolean;
  action: (materialId: string) => Promise<AdminActionState>;
};

export function DeleteMaterialButton({ materialId, materialName, disabled, action }: DeleteMaterialButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setBusy(true);
    setError("");

    const result = await action(materialId);
    if (result.status === "success") {
      router.refresh();
    } else {
      setError(result.message);
      setBusy(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        className="admin-action ghost small"
        disabled={disabled}
        onClick={() => setConfirming(true)}
        type="button"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="admin-danger-zone-actions">
      <span>Delete {materialName}?</span>
      <button className="admin-action danger small" disabled={busy} onClick={handleDelete} type="button">
        {busy ? "Deleting..." : "Confirm"}
      </button>
      <button className="admin-action ghost small" disabled={busy} onClick={() => setConfirming(false)} type="button">
        Cancel
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
