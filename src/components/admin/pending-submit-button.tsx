"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type PendingSubmitButtonProps = {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
};

// A submit button that locks itself and says what is happening while its form
// is being processed — without this, a slow save looks like nothing happened
// and people press it again.
export function PendingSubmitButton({
  children,
  className = "admin-action",
  pendingLabel = "Saving…"
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button aria-busy={pending} className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : children}
    </button>
  );
}
