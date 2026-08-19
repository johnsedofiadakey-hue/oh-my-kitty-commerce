"use client";

import { useEffect } from "react";

export default function PosError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="pos-fullscreen-message" role="alert">
      <h1>Register hit a snag</h1>
      <p>{error.message || "Something went wrong loading the register."} Try again — if a sale was in progress, check recent sales before re-ringing it up.</p>
      <button className="admin-action" onClick={() => reset()} type="button">
        Try again
      </button>
    </div>
  );
}
