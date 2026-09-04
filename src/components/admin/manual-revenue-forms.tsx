"use client";

import { useActionState, useState } from "react";
import { initialAdminActionState, type AdminActionState } from "@/lib/admin/product-form";

type ManualRevenueFormAction = (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;

export function CreateManualRevenueForm({ action, disabled }: { action: ManualRevenueFormAction; disabled: boolean }) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="admin-form">
      <fieldset disabled={disabled || pending}>
        <label className="admin-field">
          <span>What came in</span>
          <input name="label" placeholder="e.g. Old equipment sold" required />
        </label>
        <label className="admin-field">
          <span>Amount GHS</span>
          <input inputMode="decimal" name="amount" placeholder="e.g. 200.00" required />
        </label>
        <label className="admin-field">
          <span>Date</span>
          <input defaultValue={today} name="date" required type="date" />
        </label>
        <label className="admin-field">
          <span>Note (optional)</span>
          <input name="note" />
        </label>
        {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
        <button className="admin-action" type="submit">
          {pending ? "Logging..." : "Log income"}
        </button>
      </fieldset>
    </form>
  );
}

export function ManualRevenueRow({
  entryId,
  label,
  dateLabel,
  amountLabel,
  note,
  disabled,
  deleteAction
}: {
  entryId: string;
  label: string;
  dateLabel: string;
  amountLabel: string;
  note?: string;
  disabled: boolean;
  deleteAction: (entryId: string) => Promise<AdminActionState>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    if (!window.confirm(`Delete "${label}"?`)) {
      return;
    }

    setBusy(true);
    const result = await deleteAction(entryId);
    setMessage(result.status === "error" ? result.message : "");
    setBusy(false);
  }

  return (
    <div className="stack-row">
      <strong>{label}</strong>
      <span>
        {dateLabel}
        {note ? ` · ${note}` : ""}
      </span>
      <div className="stack-row-actions">
        <strong>{amountLabel}</strong>
        <button className="text-button" disabled={disabled || busy} onClick={() => void handleDelete()} type="button">
          {busy ? "Deleting..." : "Delete"}
        </button>
      </div>
      {message ? <p className="form-error">{message}</p> : null}
    </div>
  );
}
