"use client";

import { useActionState, useState } from "react";
import { initialAdminActionState, type AdminFormAction } from "@/lib/admin/product-form";
import { formatMoney } from "@/lib/commerce/format";

export type ProducibleRecipeLine = {
  materialId: string;
  materialName: string;
  unit: string;
  kind: "INGREDIENT" | "PACKAGING" | "OTHER";
  quantityPerUnit: number;
  unitCost: number;
  stockOnHand: number;
};

export type ProducibleVariant = {
  productId: string;
  variantId: string;
  label: string;
  unitCost: number;
  stockOnHand: number;
  lines: ProducibleRecipeLine[];
};

/** Trims float noise from quantities like 0.1 * 3 without hiding real decimals. */
function formatQuantity(value: number) {
  return Number.parseFloat(value.toFixed(3)).toLocaleString("en-US");
}

/**
 * Records a batch. Shows exactly what will be consumed and what it costs
 * before committing, including any material that would go negative — the
 * save is still allowed, since her physical counts routinely run ahead of
 * what's been entered.
 */
export function ProductionRunForm({
  action,
  variants,
  disabled
}: {
  action: AdminFormAction;
  variants: ProducibleVariant[];
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);
  const [variantId, setVariantId] = useState(variants[0]?.variantId ?? "");
  const [quantity, setQuantity] = useState("");

  const selected = variants.find((entry) => entry.variantId === variantId);
  const parsedQuantity = Number.parseInt(quantity, 10);
  const count = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 0;

  const consumption = selected
    ? selected.lines.map((line) => {
        const used = line.quantityPerUnit * count;
        return { ...line, used, remaining: line.stockOnHand - used, lineCost: Math.round(line.unitCost * used) };
      })
    : [];
  const batchCost = consumption.reduce((total, line) => total + line.lineCost, 0);
  const shortfalls = consumption.filter((line) => count > 0 && line.remaining < 0);

  const formKey = state.status === "success" ? `saved-${state.message}` : "editing";

  if (variants.length === 0) {
    return (
      <p className="admin-help">
        No product has a recipe yet. Build one under the Recipes tab first, then you can record production
        against it.
      </p>
    );
  }

  return (
    <form action={formAction} className="admin-form">
      <fieldset disabled={disabled || pending} key={formKey}>
        <input name="productId" type="hidden" value={selected?.productId ?? ""} />
        <label className="admin-field">
          <span>What did you make</span>
          <select name="variantId" onChange={(event) => setVariantId(event.target.value)} required value={variantId}>
            {variants.map((entry) => (
              <option key={entry.variantId} value={entry.variantId}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span>How many units</span>
          <input
            autoFocus
            inputMode="numeric"
            min="1"
            name="quantityProduced"
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="e.g. 50"
            required
            type="number"
            value={quantity}
          />
        </label>

        {selected && count > 0 ? (
          <div className="production-preview">
            <div className="panel-header">
              <h3>This batch will use</h3>
              <span>{formatMoney(batchCost)} total</span>
            </div>
            <div className="stack-list">
              {consumption.map((line) => (
                <div className="stack-row" key={line.materialId}>
                  <strong>{line.materialName}</strong>
                  <span>
                    {formatQuantity(line.used)} {line.unit} · leaves {formatQuantity(line.remaining)} {line.unit}
                    {line.kind === "PACKAGING" ? " · packaging" : ""}
                  </span>
                  <div className="stack-row-actions">
                    <strong>{formatMoney(line.lineCost)}</strong>
                  </div>
                </div>
              ))}
            </div>
            <p className="admin-help">
              {formatMoney(Math.round(batchCost / count))} per unit · finished stock goes from{" "}
              {selected.stockOnHand} to {selected.stockOnHand + count}.
            </p>
            {shortfalls.length > 0 ? (
              <div className="admin-alert" role="status">
                Not enough recorded stock for {shortfalls.map((line) => line.materialName).join(", ")}. You can
                still save this — the shortfall is flagged so you can recount later.
              </div>
            ) : null}
          </div>
        ) : null}

        <label className="admin-field">
          <span>Note (optional)</span>
          <input name="note" placeholder="Batch number, who made it, anything worth remembering" />
        </label>

        {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
        <button className="admin-action" type="submit">
          {pending ? "Recording..." : "Record production"}
        </button>
      </fieldset>
      {disabled ? <p className="admin-help">Enable Firestore and sign in to record production.</p> : null}
    </form>
  );
}
