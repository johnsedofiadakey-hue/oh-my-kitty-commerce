"use client";

import { useEffect } from "react";

export default function AdminError({
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
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Something went wrong</h1>
          <p className="app-subtitle">This page hit an error. Your data hasn&apos;t been changed.</p>
        </div>
      </div>
      <div className="admin-alert danger" role="alert">
        {error.message || "An unexpected error occurred."}
      </div>
      <button className="admin-action" onClick={() => reset()} type="button">
        Try again
      </button>
    </>
  );
}
