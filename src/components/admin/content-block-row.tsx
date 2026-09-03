"use client";

import { useActionState } from "react";
import { initialAdminActionState, type AdminFormAction } from "@/lib/admin/product-form";
import type { ContentKey } from "@/lib/storefront/content";

export function ContentBlockRow({
  contentKey,
  label,
  group,
  value,
  options,
  disabled,
  updateContentBlockAction
}: {
  contentKey: ContentKey;
  label: string;
  group: string;
  value: string;
  options?: readonly { value: string; label: string }[];
  disabled: boolean;
  updateContentBlockAction: AdminFormAction;
}) {
  const [state, formAction, pending] = useActionState(updateContentBlockAction, initialAdminActionState);

  return (
    <form action={formAction} className="quick-edit-row">
      <input name="key" type="hidden" value={contentKey} />
      <label className="admin-field">
        <span>{label}</span>
        {options ? (
          <select defaultValue={value} disabled={disabled || pending} name="value" required>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input defaultValue={value} disabled={disabled || pending} name="value" required />
        )}
      </label>
      <label className="admin-field">
        <span>Used on</span>
        <input disabled value={group} />
      </label>
      {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
      <button className="admin-action" disabled={disabled || pending} type="submit">
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
