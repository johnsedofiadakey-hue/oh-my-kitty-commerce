"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

// A hidden field carrying one id per press of "Save". Pressing twice sends the
// same id (so the server applies it once); the id is replaced as soon as a save
// finishes, so the next deliberate adjustment is a new request.
export function RequestIdField({ name = "requestId" }: { name?: string }) {
  const { pending } = useFormStatus();
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      setRequestId(crypto.randomUUID());
    }
    wasPending.current = pending;
  }, [pending]);

  return <input name={name} type="hidden" value={requestId} />;
}
