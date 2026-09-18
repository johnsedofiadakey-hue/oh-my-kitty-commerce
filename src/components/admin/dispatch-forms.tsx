"use client";

import { useActionState, useState } from "react";
import { initialAdminActionState, type AdminActionState, type AdminFormAction } from "@/lib/admin/product-form";

export type PickLine = {
  productTitle: string;
  variantTitle: string;
  sku: string;
  quantity: number;
  viaSetTitle?: string;
};

/**
 * Pack button plus the pick list it produces. The list is shown up front
 * deliberately: tapping Pack has to come *before* walking to the shelf, or the
 * one-parcel-per-order guard protects nothing during the window where two
 * people actually collide.
 */
export function PackOrderForm({
  action,
  orderId,
  orderNumber,
  lines,
  needsReshipReason,
  disabled
}: {
  action: AdminFormAction;
  orderId: string;
  orderNumber: string;
  lines: PickLine[];
  needsReshipReason: boolean;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);

  return (
    <form action={formAction} className="admin-form">
      <fieldset disabled={disabled || pending}>
        <input name="orderId" type="hidden" value={orderId} />

        <div className="pick-list">
          <div className="panel-header">
            <h3>What goes in {orderNumber}</h3>
            <span>
              {lines.reduce((total, line) => total + line.quantity, 0)} item
              {lines.reduce((total, line) => total + line.quantity, 0) === 1 ? "" : "s"}
            </span>
          </div>
          {lines.map((line) => (
            <div className="pick-line" key={`${line.sku}-${line.viaSetTitle ?? ""}`}>
              <strong>{line.quantity}&times;</strong>
              <span>
                {line.productTitle}
                {line.variantTitle && line.variantTitle !== "Default" ? ` — ${line.variantTitle}` : ""}
                {line.viaSetTitle ? ` · from ${line.viaSetTitle}` : ""}
              </span>
            </div>
          ))}
        </div>

        {needsReshipReason ? (
          <label className="admin-field">
            <span>This order was packed before and came back — why send it again?</span>
            <input name="reshipReason" placeholder="e.g. customer called back, new address" required />
          </label>
        ) : null}

        {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
        <button className="admin-action" type="submit">
          {pending ? "Packing..." : "Pack it — print the slip"}
        </button>
      </fieldset>
    </form>
  );
}

/** Records why an order couldn't be packed, so the next person doesn't repeat the trip. */
export function HoldPackingForm({
  action,
  orderId,
  disabled
}: {
  action: AdminFormAction;
  orderId: string;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);

  return (
    <form action={formAction} className="admin-form">
      <fieldset disabled={disabled || pending}>
        <input name="orderId" type="hidden" value={orderId} />
        <label className="admin-field">
          <span>What&apos;s stopping it?</span>
          <input name="reason" placeholder="e.g. out of 100ml bottles until Thursday" required />
        </label>
        {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
        <button className="admin-action ghost" type="submit">
          {pending ? "Saving..." : "Can't pack this yet"}
        </button>
      </fieldset>
    </form>
  );
}

export type DispatchableParcel = {
  id: string;
  parcelNumber: string;
  orderNumber: string;
  customerName?: string;
  destination?: string;
};

/** Hands a batch — or a single parcel — to a rider. */
export function DispatchParcelsForm({
  action,
  parcels,
  disabled
}: {
  action: AdminFormAction;
  parcels: DispatchableParcel[];
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  }

  return (
    <form action={formAction} className="admin-form">
      <fieldset disabled={disabled || pending}>
        <div className="admin-panel-footer-row">
          <span className="admin-help">{selected.length} selected</span>
          <button
            className="text-button"
            onClick={() => setSelected(selected.length === parcels.length ? [] : parcels.map((p) => p.id))}
            type="button"
          >
            {selected.length === parcels.length ? "Clear all" : "Select all"}
          </button>
        </div>

        <div className="stack-list">
          {parcels.map((parcel) => (
            <label className="stack-row dispatch-row" key={parcel.id}>
              <input
                checked={selected.includes(parcel.id)}
                name="parcelIds"
                onChange={() => toggle(parcel.id)}
                type="checkbox"
                value={parcel.id}
              />
              <strong>{parcel.parcelNumber}</strong>
              <span>
                {parcel.customerName ?? "Customer"}
                {parcel.destination ? ` · ${parcel.destination}` : ""}
              </span>
            </label>
          ))}
        </div>

        <label className="admin-field">
          <span>Who&apos;s taking them? (optional)</span>
          <input name="courier" placeholder="e.g. Kwame" />
        </label>

        {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
        <button className="admin-action" disabled={selected.length === 0} type="submit">
          {pending ? "Dispatching..." : `Dispatch ${selected.length || ""}`.trim()}
        </button>
      </fieldset>
    </form>
  );
}

/** Manager-only: recording a return is what frees an order to be packed again. */
export function ReturnParcelForm({
  action,
  parcelId,
  parcelNumber,
  disabled
}: {
  action: AdminFormAction;
  parcelId: string;
  parcelNumber: string;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);

  return (
    <form action={formAction} className="admin-form">
      <fieldset disabled={disabled || pending}>
        <input name="parcelId" type="hidden" value={parcelId} />
        <p className="admin-help">
          Only record this once {parcelNumber} is physically back in your hands — it unlocks the order to be
          packed and sent again.
        </p>
        <label className="admin-field">
          <span>Why did it come back?</span>
          <input name="reason" placeholder="e.g. customer unreachable, refused at the door" required />
        </label>
        <label className="admin-field checkbox">
          <input defaultChecked name="restock" type="checkbox" />
          <span>Put the items back into stock</span>
        </label>
        {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
        <button className="admin-action" type="submit">
          {pending ? "Saving..." : "Record return"}
        </button>
      </fieldset>
    </form>
  );
}

/** Closes a dispatched parcel out once it's known to have arrived. */
export function MarkDeliveredButton({
  action,
  parcelId,
  disabled
}: {
  action: (parcelId: string) => Promise<AdminActionState>;
  parcelId: string;
  disabled: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleClick() {
    setBusy(true);
    const result = await action(parcelId);
    setMessage(result.status === "error" ? result.message : "");
    setBusy(false);
  }

  return (
    <>
      <button
        className="admin-action ghost small"
        disabled={disabled || busy}
        onClick={() => void handleClick()}
        type="button"
      >
        {busy ? "Saving..." : "Delivered"}
      </button>
      {message ? <p className="form-error">{message}</p> : null}
    </>
  );
}
