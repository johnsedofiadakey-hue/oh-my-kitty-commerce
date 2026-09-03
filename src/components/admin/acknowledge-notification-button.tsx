"use client";

import { useActionState } from "react";
import { initialAdminActionState, type AdminFormAction } from "@/lib/admin/product-form";

export function AcknowledgeNotificationButton({
  notificationId,
  disabled,
  acknowledgeNotificationAction
}: {
  notificationId: string;
  disabled: boolean;
  acknowledgeNotificationAction: AdminFormAction;
}) {
  const [state, formAction, pending] = useActionState(acknowledgeNotificationAction, initialAdminActionState);

  return (
    <form action={formAction}>
      <input name="id" type="hidden" value={notificationId} />
      {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
      <button className="admin-action ghost small" disabled={disabled || pending} type="submit">
        {pending ? "Acknowledging..." : "Acknowledge"}
      </button>
    </form>
  );
}
