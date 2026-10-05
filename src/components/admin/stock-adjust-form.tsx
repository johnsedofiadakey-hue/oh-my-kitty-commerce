"use client";

import { useActionState, useState } from "react";
import { PendingSubmitButton } from "@/components/admin/pending-submit-button";
import { RequestIdField } from "@/components/admin/request-id-field";
import {
  initialAdminActionState,
  type AdminActionState,
  type AdminFormAction
} from "@/lib/admin/product-form";

type Mode = "add" | "remove" | "set";

type StockAdjustFormProps = {
  action: AdminFormAction;
  currentStock: number;
  disabled: boolean;
  productId: string;
  variantId: string;
};

const modes: { value: Mode; label: string; question: string }[] = [
  { value: "add", label: "Add stock", question: "How many are you adding?" },
  { value: "remove", label: "Remove stock", question: "How many are you removing?" },
  { value: "set", label: "Set exact count", question: "How many do you have on the shelf?" }
];

// Three plain choices instead of a +/- box: add some, remove some, or type
// what you actually counted and let the app work out the difference. It says
// what will happen before you save, and what did happen after.
export function StockAdjustForm({ action, currentStock, disabled, productId, variantId }: StockAdjustFormProps) {
  const [mode, setMode] = useState<Mode>(currentStock < 0 ? "set" : "add");
  const [amount, setAmount] = useState("");

  // Once a save succeeds the number is cleared, so pressing Save again can't
  // apply it a second time.
  const [state, formAction] = useActionState<AdminActionState, FormData>(async (previous, formData) => {
    const result = await action(previous, formData);
    if (result.status === "success") {
      setAmount("");
    }
    return result;
  }, initialAdminActionState);

  const question = modes.find((entry) => entry.value === mode)?.question ?? "";
  const entered = /^\d+$/.test(amount) ? Number(amount) : null;
  const after =
    entered === null ? null : mode === "add" ? currentStock + entered : mode === "remove" ? currentStock - entered : entered;
  const tooMany = mode === "remove" && after !== null && after < 0;

  return (
    <form action={formAction} className="admin-form">
      <input name="productId" type="hidden" value={productId} />
      <input name="variantId" type="hidden" value={variantId} />
      <input name="mode" type="hidden" value={mode} />
      <RequestIdField />
      <fieldset disabled={disabled}>
        {currentStock < 0 ? (
          <p className="admin-form-status error">
            The count is {currentStock}, which means something was recorded wrongly. Count what is really on the
            shelf and enter it under &ldquo;Set exact count&rdquo;.
          </p>
        ) : null}

        <div aria-label="What do you want to do?" className="stock-mode" role="radiogroup">
          {modes.map((entry) => (
            <label key={entry.value}>
              <input
                checked={mode === entry.value}
                name="stock-mode-choice"
                onChange={() => setMode(entry.value)}
                type="radio"
                value={entry.value}
              />
              <span>{entry.label}</span>
            </label>
          ))}
        </div>

        <label className="admin-field">
          <span>{question}</span>
          <input
            inputMode="numeric"
            min={0}
            name="amount"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
            required
            step={1}
            type="number"
            value={amount}
          />
        </label>

        {mode === "remove" ? (
          <label className="admin-field">
            <span>Why?</span>
            <select defaultValue="MANUAL_ADJUSTMENT" name="removeType">
              <option value="DAMAGE">Damaged</option>
              <option value="LOSS">Lost</option>
              <option value="MANUAL_ADJUSTMENT">Something else</option>
            </select>
          </label>
        ) : null}

        <label className="admin-field">
          <span>Note (optional)</span>
          <input maxLength={120} name="note" placeholder="e.g. delivery from supplier" />
        </label>

        <p aria-live="polite" className={tooMany ? "stock-preview warn" : "stock-preview"}>
          {tooMany
            ? `You only have ${currentStock}, so you can't remove ${entered}.`
            : after === null
              ? `You have ${currentStock} now.`
              : `${currentStock} now → ${after} after saving`}
        </p>

        {state.message ? (
          <p aria-live="polite" className={`admin-form-status ${state.status}`} role="status">
            {state.message}
          </p>
        ) : null}
        <PendingSubmitButton>Save</PendingSubmitButton>
      </fieldset>
    </form>
  );
}
