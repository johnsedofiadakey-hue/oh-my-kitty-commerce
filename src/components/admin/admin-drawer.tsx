"use client";

import { useEffect, useState, type ReactNode } from "react";

type AdminDrawerProps = {
  triggerLabel?: string;
  triggerClassName?: string;
  /** Custom trigger content (e.g. a full summary row) instead of a plain labeled button. */
  trigger?: ReactNode;
  title: string;
  children: ReactNode;
};

export function AdminDrawer({
  triggerLabel,
  triggerClassName = "admin-action",
  trigger,
  title,
  children
}: AdminDrawerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    document.body.style.overflow = "hidden";

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [open]);

  return (
    <>
      <button
        className={trigger ? "admin-drawer-row-trigger" : triggerClassName}
        onClick={() => setOpen(true)}
        type="button"
      >
        {trigger ?? triggerLabel}
      </button>
      {open ? (
        <button
          aria-label={`Close ${title}`}
          className="admin-drawer-scrim"
          onClick={() => setOpen(false)}
          type="button"
        />
      ) : null}
      <aside aria-hidden={!open} aria-label={title} className={open ? "admin-drawer open" : "admin-drawer"}>
        <div className="admin-drawer-head">
          <h2>{title}</h2>
          <button
            aria-label="Close"
            className="admin-drawer-close"
            onClick={() => setOpen(false)}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="admin-drawer-body">{children}</div>
      </aside>
    </>
  );
}
