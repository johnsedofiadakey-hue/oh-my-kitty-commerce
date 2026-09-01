"use client";

import { useState } from "react";
import type { AdminActionState } from "@/lib/admin/product-form";

type ResetStaffPasswordButtonProps = {
  userId: string;
  disabled?: boolean;
  action: (previousState: AdminActionState, formData: FormData) => Promise<AdminActionState>;
};

export function ResetStaffPasswordButton({ userId, disabled, action }: ResetStaffPasswordButtonProps) {
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ status: AdminActionState["status"]; text: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setResult(null);

    const formData = new FormData();
    formData.set("id", userId);
    formData.set("newPassword", newPassword);

    const initial: AdminActionState = { status: "idle", message: "" };
    const response = await action(initial, formData);
    setResult({ status: response.status, text: response.message });
    setBusy(false);
    if (response.status === "success") {
      setNewPassword("");
    }
  }

  if (!open) {
    return (
      <button
        className="admin-action ghost small"
        disabled={disabled}
        onClick={() => {
          setOpen(true);
          setResult(null);
        }}
        type="button"
      >
        Reset password
      </button>
    );
  }

  return (
    <form className="admin-inline-confirm" onSubmit={handleSubmit}>
      <input
        autoComplete="new-password"
        disabled={busy}
        minLength={6}
        onChange={(event) => setNewPassword(event.target.value)}
        placeholder="New password (min 6 characters)"
        required
        type="password"
        value={newPassword}
      />
      {result ? (
        <p className={result.status === "error" ? "form-error" : "admin-form-status success"}>{result.text}</p>
      ) : null}
      <div className="admin-danger-zone-actions">
        <button className="admin-action small" disabled={busy} type="submit">
          {busy ? "Setting..." : "Set password"}
        </button>
        <button
          className="admin-action ghost small"
          disabled={busy}
          onClick={() => {
            setOpen(false);
            setNewPassword("");
            setResult(null);
          }}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
