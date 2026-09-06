"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { initialAdminActionState, type AdminActionState } from "@/lib/admin/product-form";
import { compressAndUploadImage } from "@/lib/admin/upload-image";
import { formatMoney } from "@/lib/commerce/format";
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

  // Remounting the fieldset after a successful save clears every input, so
  // several expenses can be logged one after another without closing the
  // dialog — the "fill it in and move on" flow this is used for.
  const formKey = state.status === "success" ? `saved-${state.message}` : "editing";

  return (
    <form action={formAction} className="admin-form">
      <fieldset disabled={disabled || pending} key={formKey}>
        <label className="admin-field">
          <span>What was it for</span>
          <input autoFocus name="name" placeholder="e.g. Bottles from supplier" required />
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
          <input inputMode="decimal" name="amount" placeholder="e.g. 150.00" required />
        </label>
        <label className="admin-field">
          <span>Date</span>
          <input defaultValue={today} name="date" required type="date" />
        </label>
        <label className="admin-field">
          <span>Comments (optional)</span>
          <textarea name="note" placeholder="Anything worth remembering about this spend" rows={2} />
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
  name,
  categoryId,
  categoryTitle,
  categories,
  dateLabel,
  dateValue,
  amountLabel,
  amountValue,
  note,
  isRecurring,
  receiptUrl,
  disabled,
  deleteAction,
  updateAction,
  attachReceiptAction,
  removeReceiptAction
}: {
  expenseId: string;
  name?: string;
  categoryId: string;
  categoryTitle: string;
  categories: ExpenseCategory[];
  dateLabel: string;
  dateValue: string;
  amountLabel: string;
  amountValue: string;
  note?: string;
  isRecurring: boolean;
  receiptUrl?: string;
  disabled: boolean;
  deleteAction: (expenseId: string) => Promise<AdminActionState>;
  updateAction: CreateExpenseCategoryAction;
  attachReceiptAction: (
    expenseId: string,
    input: { storagePath: string; url: string; alt: string }
  ) => Promise<AdminActionState>;
  removeReceiptAction: (expenseId: string) => Promise<AdminActionState>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateAction, initialAdminActionState);
  // Rows logged before the name field existed fall back to the category.
  const title = name || categoryTitle;

  async function handleDelete() {
    if (!window.confirm(`Delete "${title}"?`)) {
      return;
    }

    setBusy(true);
    const result = await deleteAction(expenseId);
    setMessage(result.status === "error" ? result.message : "");
    setBusy(false);
  }

  if (editing) {
    return (
      <form action={formAction} className="admin-form stack-row-edit">
        <fieldset disabled={disabled || pending}>
          <input name="id" type="hidden" value={expenseId} />
          <label className="admin-field">
            <span>What was it for</span>
            <input defaultValue={name ?? ""} name="name" required />
          </label>
          <label className="admin-field">
            <span>Category</span>
            <select defaultValue={categoryId} name="categoryId" required>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span>Amount GHS</span>
            <input defaultValue={amountValue} inputMode="decimal" name="amount" required />
          </label>
          <label className="admin-field">
            <span>Date</span>
            <input defaultValue={dateValue} name="date" required type="date" />
          </label>
          <label className="admin-field">
            <span>Comments (optional)</span>
            <textarea defaultValue={note ?? ""} name="note" rows={2} />
          </label>
          {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
          <div className="stack-row-actions">
            <button className="admin-action" type="submit">
              {pending ? "Saving..." : "Save changes"}
            </button>
            <button className="text-button" onClick={() => setEditing(false)} type="button">
              Cancel
            </button>
          </div>
        </fieldset>
        {/* Outside the fieldset: uploading a receipt is its own action and
            must stay usable while the edit form is submitting. */}
        <ExpenseReceiptUploader
          attachAction={attachReceiptAction}
          disabled={disabled}
          expenseId={expenseId}
          receiptUrl={receiptUrl}
          removeAction={removeReceiptAction}
        />
      </form>
    );
  }

  return (
    <div className="stack-row">
      <strong>{title}</strong>
      <span>
        {dateLabel} · {categoryTitle}
        {note ? ` · ${note}` : ""}
        {isRecurring ? " · recurring" : ""}
      </span>
      <div className="stack-row-actions">
        <strong>{amountLabel}</strong>
        {receiptUrl ? (
          <a className="text-button" href={receiptUrl} rel="noopener" target="_blank">
            Receipt
          </a>
        ) : null}
        <button className="text-button" disabled={disabled || busy} onClick={() => setEditing(true)} type="button">
          Edit
        </button>
        <button className="text-button" disabled={disabled || busy} onClick={() => void handleDelete()} type="button">
          {busy ? "Deleting..." : "Delete"}
        </button>
      </div>
      {message ? <p className="form-error">{message}</p> : null}
    </div>
  );
}

/**
 * Photo of the receipt for an expense — the proof-of-spend half of
 * bookkeeping. Uploads straight to storage from the browser (same path as
 * product images), then records and links the asset server-side.
 */
export function ExpenseReceiptUploader({
  expenseId,
  receiptUrl,
  disabled,
  attachAction,
  removeAction
}: {
  expenseId: string;
  receiptUrl?: string;
  disabled: boolean;
  attachAction: (
    expenseId: string,
    input: { storagePath: string; url: string; alt: string }
  ) => Promise<AdminActionState>;
  removeAction: (expenseId: string) => Promise<AdminActionState>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ status: AdminActionState["status"]; text: string } | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const { storagePath, url } = await compressAndUploadImage(
        file,
        (extension) => `public/receipts/${expenseId}-${Date.now()}.${extension}`
      );
      const result = await attachAction(expenseId, { storagePath, url, alt: `Receipt for ${expenseId}` });
      setMessage({ status: result.status, text: result.message });
    } catch (error) {
      setMessage({ status: "error", text: error instanceof Error ? error.message : "Upload failed." });
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function handleRemove() {
    setBusy(true);
    const result = await removeAction(expenseId);
    setMessage({ status: result.status, text: result.message });
    setBusy(false);
  }

  return (
    <div className="expense-receipt-control">
      {receiptUrl ? (
        <>
          <a className="text-button" href={receiptUrl} rel="noopener" target="_blank">
            View receipt
          </a>
          <button className="text-button" disabled={disabled || busy} onClick={() => void handleRemove()} type="button">
            {busy ? "Removing..." : "Remove"}
          </button>
        </>
      ) : (
        <label className="admin-field">
          <span>Receipt photo (optional)</span>
          <input accept="image/*" disabled={disabled || busy} onChange={(event) => void handleFile(event)} type="file" />
        </label>
      )}
      {busy && !receiptUrl ? <p className="admin-help">Uploading...</p> : null}
      {message ? <p className={`admin-form-status ${message.status}`}>{message.text}</p> : null}
    </div>
  );
}

export type ExpenseLogEntry = {
  id: string;
  name?: string;
  categoryId: string;
  categoryTitle: string;
  dateLabel: string;
  dateValue: string;
  amountLabel: string;
  amountValue: string;
  /** Minor units, so the filtered subtotal can be recomputed as you search. */
  amountMinor: number;
  note?: string;
  isRecurring: boolean;
  receiptUrl?: string;
};

/**
 * The expense log with a search box. Filtering happens here rather than on
 * the server because the whole list is already loaded for the P&L totals —
 * a round trip per keystroke would buy nothing.
 */
export function ExpenseLog({
  entries,
  categories,
  disabled,
  deleteAction,
  updateAction,
  attachReceiptAction,
  removeReceiptAction
}: {
  entries: ExpenseLogEntry[];
  categories: ExpenseCategory[];
  disabled: boolean;
  deleteAction: (expenseId: string) => Promise<AdminActionState>;
  updateAction: CreateExpenseCategoryAction;
  attachReceiptAction: (
    expenseId: string,
    input: { storagePath: string; url: string; alt: string }
  ) => Promise<AdminActionState>;
  removeReceiptAction: (expenseId: string) => Promise<AdminActionState>;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const needle = query.trim().toLowerCase();
  const filtered = entries.filter((entry) => {
    if (categoryFilter && entry.categoryId !== categoryFilter) {
      return false;
    }
    if (!needle) {
      return true;
    }

    return [entry.name, entry.categoryTitle, entry.note, entry.dateLabel]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(needle));
  });
  const filteredTotal = filtered.reduce((total, entry) => total + entry.amountMinor, 0);
  const narrowed = filtered.length !== entries.length;

  return (
    <>
      <div className="admin-filter-row">
        <label className="admin-field">
          <span>Search</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, category, or comment"
            type="search"
            value={query}
          />
        </label>
        <label className="admin-field">
          <span>Category</span>
          <select onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {narrowed ? (
        <p className="admin-help">
          {filtered.length} of {entries.length} shown · {formatMoney(filteredTotal)}
        </p>
      ) : null}

      <div className="stack-list">
        {filtered.map((entry) => (
          <ExpenseRow
            amountLabel={entry.amountLabel}
            amountValue={entry.amountValue}
            attachReceiptAction={attachReceiptAction}
            categories={categories}
            categoryId={entry.categoryId}
            categoryTitle={entry.categoryTitle}
            dateLabel={entry.dateLabel}
            dateValue={entry.dateValue}
            deleteAction={deleteAction}
            disabled={disabled}
            expenseId={entry.id}
            isRecurring={entry.isRecurring}
            key={entry.id}
            name={entry.name}
            note={entry.note}
            receiptUrl={entry.receiptUrl}
            removeReceiptAction={removeReceiptAction}
            updateAction={updateAction}
          />
        ))}
        {entries.length === 0 ? <p className="admin-help">Nothing logged yet.</p> : null}
        {entries.length > 0 && filtered.length === 0 ? (
          <p className="admin-help">Nothing matches that search.</p>
        ) : null}
      </div>
    </>
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
