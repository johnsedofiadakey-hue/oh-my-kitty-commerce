"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { WhatsAppCta } from "@/components/storefront/whatsapp-cta";

type Status = "idle" | "submitting" | "sent" | "error";

export function GuidanceDialog({
  triggerClassName,
  triggerLabel,
  whatsappNumber,
  whatsappMessage
}: {
  triggerClassName?: string;
  triggerLabel: string;
  whatsappNumber: string;
  whatsappMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [sentNumber, setSentNumber] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    if (status === "sent") {
      setStatus("idle");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const message = String(formData.get("message") ?? "");
    const contactNumber = String(formData.get("contactNumber") ?? "");
    const company = String(formData.get("company") ?? "");

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, contactNumber, company })
      });
      const payload = (await response.json()) as { message?: string; ok?: boolean };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "Couldn't send your message — try again in a moment.");
      }

      setSentNumber(contactNumber);
      form.reset();
      setStatus("sent");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Couldn't send your message — try again in a moment.");
    }
  }

  // Rendered via a portal to document.body: the trigger button sits inside
  // the hero's GSAP-scrubbed DOM, and an ancestor there carries an active
  // `transform` (even an identity one), which turns `position: fixed` on
  // this dialog into "fixed relative to that transformed ancestor" instead
  // of the viewport — the dialog would render clipped to a sliver of the
  // hero copy block instead of covering the screen. Portaling escapes that
  // entirely, same as any modal nested under a transformed ancestor needs to.
  const dialog = open ? (
    <div className="guidance-sheet-backdrop" onClick={close} role="presentation">
      <aside
        aria-labelledby="guidance-sheet-title"
        aria-modal="true"
        className="guidance-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button aria-label="Close" className="sheet-close" onClick={close} type="button">
          <span aria-hidden="true">x</span>
        </button>

        {status === "sent" ? (
          <div className="guidance-sheet-confirm">
            <h2>Message sent</h2>
            <p>We&apos;ll reply on WhatsApp at {sentNumber} soon.</p>
            <button className="portal-cta" onClick={close} type="button">
              <span>Done</span>
            </button>
          </div>
        ) : (
          <form className="guidance-form" onSubmit={(event) => void handleSubmit(event)}>
            <h2 id="guidance-sheet-title">Get guidance</h2>
            <p>Ask about symptoms, products, or your order — we&apos;ll reply on WhatsApp.</p>
            <label className="guidance-field">
              <span>What&apos;s on your mind?</span>
              <textarea
                disabled={status === "submitting"}
                name="message"
                placeholder="e.g. Which set is right for a mild infection?"
                required
                rows={4}
              />
            </label>
            <label className="guidance-field">
              <span>Your WhatsApp number</span>
              <input
                disabled={status === "submitting"}
                inputMode="tel"
                name="contactNumber"
                placeholder="024 000 0000"
                required
                type="tel"
              />
            </label>
            <input
              aria-hidden="true"
              autoComplete="off"
              className="guidance-honeypot"
              name="company"
              tabIndex={-1}
              type="text"
            />
            {status === "error" ? <p className="form-error">{errorMessage}</p> : null}
            <button className="portal-cta" disabled={status === "submitting"} type="submit">
              <span>{status === "submitting" ? "Sending..." : "Send message"}</span>
            </button>
            <WhatsAppCta
              className="text-button"
              label="Message us directly on WhatsApp"
              message={whatsappMessage}
              phoneNumber={whatsappNumber}
            />
          </form>
        )}
      </aside>
    </div>
  ) : null;

  return (
    <>
      <button className={triggerClassName} onClick={() => setOpen(true)} type="button">
        {triggerLabel}
      </button>
      {dialog ? createPortal(dialog, document.body) : null}
    </>
  );
}
