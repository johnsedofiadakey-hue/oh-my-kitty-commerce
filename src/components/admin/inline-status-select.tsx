"use client";

import { useTransition, type ChangeEvent } from "react";
import { formatFulfilmentStatus } from "@/lib/commerce/format";

const FULFILMENT_STATUSES = [
  "UNFULFILLED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "FULFILLED",
  "CANCELLED"
] as const;

type InlineStatusSelectProps = {
  orderId: string;
  currentStatus: string;
  disabled: boolean;
  action: (formData: FormData) => Promise<void>;
};

/** Changes fulfilment status in one tap, right from the order row — no drawer needed for the common case. */
export function InlineStatusSelect({ orderId, currentStatus, disabled, action }: InlineStatusSelectProps) {
  const [pending, startTransition] = useTransition();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const formData = new FormData();
    formData.set("id", orderId);
    formData.set("fulfilmentStatus", event.target.value);
    startTransition(() => {
      void action(formData);
    });
  }

  return (
    <select
      aria-label="Fulfilment status"
      className="inline-status-select"
      defaultValue={currentStatus}
      disabled={disabled || pending}
      onChange={handleChange}
      onClick={(event) => event.stopPropagation()}
    >
      {FULFILMENT_STATUSES.map((status) => (
        <option key={status} value={status}>
          {formatFulfilmentStatus(status)}
        </option>
      ))}
    </select>
  );
}
