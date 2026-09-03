"use client";

import { useActionState } from "react";
import { initialAdminActionState, type AdminFormAction } from "@/lib/admin/product-form";

export function DeleteMediaButton({
  mediaId,
  disabled,
  deleteMediaAssetAction
}: {
  mediaId: string;
  disabled: boolean;
  deleteMediaAssetAction: AdminFormAction;
}) {
  const [state, formAction, pending] = useActionState(deleteMediaAssetAction, initialAdminActionState);

  return (
    <form action={formAction}>
      <input name="id" type="hidden" value={mediaId} />
      {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
      <button className="admin-action ghost small" disabled={disabled || pending} type="submit">
        {pending ? "Deleting..." : "Delete"}
      </button>
    </form>
  );
}
