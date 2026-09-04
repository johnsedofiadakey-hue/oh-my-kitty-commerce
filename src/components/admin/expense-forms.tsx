"use client";

import { useActionState, useState } from "react";
import { initialAdminActionState, type AdminActionState } from "@/lib/admin/product-form";
import type { ExpenseCategory } from "@/lib/commerce/types";

type CreateExpenseCategoryAction = (
  state: AdminActionState,
  formData: FormData
) => Promise<AdminActionState>;

export function CreateExpenseCategoryForm({
  action,
  disabled
}: {
  action: CreateExpenseCategoryAction;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);

  return (
    <form action={formAction} className="admin-form">
      <fieldset disabled={disabled || pending}>
        <label className="admin-field">
          <span>Category name</span>
          <input name="title" placeholder="e.g. Transport" required />
        </label>
        {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
        <button className="admin-action" type="submit">
          {pending ? "Adding..." : "Add category"}
        </button>
      </fieldset>
    </form>
  );
}

export function CreateExpenseForm({
  action,
  categories,
  disabled
}: {
  action: CreateExpenseCategoryAction;
  categories: ExpenseCategory[];
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="admin-form">
      <fieldset disabled={disabled || pending}>
        <label className="admin-field">
          <span>Category</span>
          <select name="categoryId" required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span>Amount GHS</span>
          <input inputMode="decimal" name="amount" placeholder="e.g. 150.00" required />
        </label>
        <label className="admin-field">
          <span>Date</span>
          <input defaultValue={today} name="date" required type="date" />
        </label>
        <label className="admin-field">
          <span>Note (optional)</span>
          <input name="note" placeholder="e.g. Bottles from supplier" />
        </label>
        {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
        <button className="admin-action" type="submit">
          {pending ? "Logging..." : "Log expense"}
        </button>
      </fieldset>
    </form>
  );
}

// Takes plain, already-formatted primitives rather than the raw Expense
// object — a Date field passed as a prop into a client component breaks
// RSC serialization (same issue as Firestore Timestamps elsewhere in
// admin), so the server page formats id/date/amount to strings first.
export function ExpenseRow({
  expenseId,
  categoryTitle,
  dateLabel,
  amountLabel,
  note,
  isRecurring,
  disabled,
  deleteAction
}: {
  expenseId: string;
  categoryTitle: string;
  dateLabel: string;
  amountLabel: string;
  note?: string;
  isRecurring: boolean;
  disabled: boolean;
  deleteAction: (expenseId: string) => Promise<AdminActionState>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    if (!window.confirm(`Delete this ${categoryTitle} expense?`)) {
      return;
    }

    setBusy(true);
    const result = await deleteAction(expenseId);
    setMessage(result.status === "error" ? result.message : "");
    setBusy(false);
  }

  return (
    <div className="stack-row">
      <strong>{categoryTitle}</strong>
      <span>
        {dateLabel}
        {note ? ` · ${note}` : ""}
        {isRecurring ? " · recurring" : ""}
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

export function CreateRecurringExpenseForm({
  action,
  categories,
  disabled
}: {
  action: CreateExpenseCategoryAction;
  categories: ExpenseCategory[];
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);

  return (
    <form action={formAction} className="admin-form">
      <fieldset disabled={disabled || pending}>
        <label className="admin-field">
          <span>Label</span>
          <input name="label" placeholder="e.g. Shop rent" required />
        </label>
        <label className="admin-field">
          <span>Category</span>
          <select name="categoryId" required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span>Amount GHS</span>
          <input inputMode="decimal" name="amount" placeholder="e.g. 800.00" required />
        </label>
        <label className="admin-field">
          <span>Due day of month</span>
          <input defaultValue="1" inputMode="numeric" max="28" min="1" name="dayOfMonth" required type="number" />
        </label>
        {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
        <button className="admin-action" type="submit">
          {pending ? "Adding..." : "Add recurring expense"}
        </button>
      </fieldset>
    </form>
  );
}

export function RecurringExpenseRow({
  templateId,
  label,
  categoryTitle,
  amountLabel,
  dayOfMonth,
  lastLoggedPeriod,
  disabled,
  currentPeriod,
  logAction,
  deleteAction
}: {
  templateId: string;
  label: string;
  categoryTitle: string;
  amountLabel: string;
  dayOfMonth: number;
  lastLoggedPeriod: string | null;
  disabled: boolean;
  currentPeriod: string;
  logAction: (templateId: string, period: string) => Promise<AdminActionState>;
  deleteAction: (templateId: string) => Promise<AdminActionState>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const paidThisPeriod = lastLoggedPeriod === currentPeriod;

  async function handleLog() {
    setBusy(true);
    const result = await logAction(templateId, currentPeriod);
    setMessage(result.message);
    setBusy(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Remove the recurring expense "${label}"? Past logged expenses stay.`)) {
      return;
    }

    setBusy(true);
    const result = await deleteAction(templateId);
    setMessage(result.status === "error" ? result.message : "");
    setBusy(false);
  }

  return (
    <div className="stack-row">
      <strong>{label}</strong>
      <span>
        {categoryTitle} &middot; {amountLabel} &middot; due day {dayOfMonth}
      </span>
      <div className="stack-row-actions">
        {paidThisPeriod ? (
          <span className="order-status-pill good">Logged for {currentPeriod}</span>
        ) : (
          <button className="admin-action ghost small" disabled={disabled || busy} onClick={() => void handleLog()} type="button">
            {busy ? "Logging..." : "Log as paid"}
          </button>
        )}
        <button className="text-button" disabled={disabled || busy} onClick={() => void handleDelete()} type="button">
          Remove
        </button>
      </div>
      {message ? <p className="admin-help">{message}</p> : null}
    </div>
  );
}
