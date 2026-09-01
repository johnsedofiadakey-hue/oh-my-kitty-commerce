"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminActionState } from "@/lib/admin/product-form";

type DeleteStaffButtonProps = {
  staffId: string;
  staffEmail: string;
  disabled?: boolean;
  action: (staffId: string) => Promise<AdminActionState>;
};

export function DeleteStaffButton({ staffId, staffEmail, disabled, action }: DeleteStaffButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [typedEmail, setTypedEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const matches = typedEmail.trim() === staffEmail;

  async function handleDelete() {
    setBusy(true);
    setError("");

    const result = await action(staffId);
    if (result.status === "success") {
      router.refresh();
    } else {
      setError(result.message);
      setBusy(false);
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
        Delete account
      </button>
    );
  }

  return (
    <div className="admin-inline-confirm">
      <p>
        This permanently deletes the account for <strong>{staffEmail}</strong> and signs them out for good.
        Type their email to confirm.
      </p>
      <input
        disabled={busy}
        onChange={(event) => setTypedEmail(event.target.value)}
        placeholder={staffEmail}
        value={typedEmail}
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
            setTypedEmail("");
            setError("");
          }}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
