"use client";

import { useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { formatMoney } from "@/lib/commerce/format";

export type RecentPosSale = {
  orderId: string;
  orderNumber: string;
  total: number;
  reversed?: "REFUND" | "VOID";
};

type ReversalMode = "REFUND" | "VOID";

export function PosRecentSales({
  sales,
  onReversed,
  heading = "Recent sales",
  subtitle = "Refund or void this shift's sales",
  bare = false
}: {
  sales: RecentPosSale[];
  onReversed: (orderId: string, mode: ReversalMode) => void;
  heading?: string;
  subtitle?: string;
  /** Skip the outer panel chrome — for callers that already provide their own. */
  bare?: boolean;
}) {
  const [target, setTarget] = useState<{
    orderId: string;
    orderNumber: string;
    mode: ReversalMode;
  } | null>(null);

  if (sales.length === 0) {
    return null;
  }

  const body = (
    <>
      <div className="stack-list">
        {sales.map((sale) => (
          <div className="stack-row pos-reversal-row" key={sale.orderId}>
            <div>
              <strong>{sale.orderNumber}</strong>
              <span>{formatMoney(sale.total)}</span>
            </div>
            {sale.reversed ? (
              <span className="status danger">{sale.reversed === "REFUND" ? "Refunded" : "Voided"}</span>
            ) : (
              <span className="pos-reversal-actions">
                <button
                  className="pos-secondary-button"
                  onClick={() =>
                    setTarget({ orderId: sale.orderId, orderNumber: sale.orderNumber, mode: "REFUND" })
                  }
                  type="button"
                >
                  Refund
                </button>
                <button
                  className="pos-secondary-button"
                  onClick={() =>
                    setTarget({ orderId: sale.orderId, orderNumber: sale.orderNumber, mode: "VOID" })
                  }
                  type="button"
                >
                  Void
                </button>
              </span>
            )}
          </div>
        ))}
      </div>
      {target ? (
        <PosReversalForm
          mode={target.mode}
          onClose={() => setTarget(null)}
          onDone={() => {
            onReversed(target.orderId, target.mode);
            setTarget(null);
          }}
          orderId={target.orderId}
          orderNumber={target.orderNumber}
        />
      ) : null}
    </>
  );

  if (bare) {
    return body;
  }

  return (
    <section className="pos-shift-panel" aria-label={heading}>
      <div className="pos-shift-heading">
        <strong>{heading}</strong>
        <span>{subtitle}</span>
      </div>
      {body}
    </section>
  );
}

function PosReversalForm({
  mode,
  onClose,
  onDone,
  orderId,
  orderNumber
}: {
  mode: ReversalMode;
  onClose: () => void;
  onDone: () => void;
  orderId: string;
  orderNumber: string;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [approverEmail, setApproverEmail] = useState("");
  const [approverPassword, setApproverPassword] = useState("");
  const actionLabel = mode === "REFUND" ? "Refund" : "Void";

  async function runReversal(approverIdToken?: string) {
    const response = await fetch(mode === "REFUND" ? "/api/pos/refund" : "/api/pos/void", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason, approverIdToken })
    });
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      throw new ReversalRequestError(payload?.message ?? `${actionLabel} failed.`);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await runReversal();
      onDone();
    } catch (submitError) {
      if (submitError instanceof ReversalRequestError && /manager|approval/i.test(submitError.message)) {
        setNeedsApproval(true);
        setError(submitError.message);
      } else {
        setError(submitError instanceof Error ? submitError.message : `${actionLabel} failed.`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function approveAndSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const auth = getClientAuth();
    if (!auth) {
      setBusy(false);
      setError("Firebase is not configured for this environment yet.");
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, approverEmail.trim(), approverPassword);
      const idToken = await credential.user.getIdToken();
      await signOut(auth);
      await runReversal(idToken);
      onDone();
    } catch (approvalError) {
      setError(getApproverErrorMessage(approvalError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="pos-reversal-form" onSubmit={needsApproval ? approveAndSubmit : submit}>
      <p className="pos-hint">
        {actionLabel} {orderNumber}
      </p>
      <label className="admin-field">
        <span>Reason</span>
        <input
          disabled={busy}
          minLength={3}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Customer request, damaged item, mis-ring..."
          required
          value={reason}
        />
      </label>
      {needsApproval ? (
        <>
          <p className="pos-hint">
            This is over your {actionLabel.toLowerCase()} limit. A manager must sign in to approve it.
          </p>
          <label className="admin-field">
            <span>Manager email</span>
            <input
              disabled={busy}
              onChange={(event) => setApproverEmail(event.target.value)}
              required
              type="email"
              value={approverEmail}
            />
          </label>
          <label className="admin-field">
            <span>Manager password</span>
            <input
              disabled={busy}
              onChange={(event) => setApproverPassword(event.target.value)}
              required
              type="password"
              value={approverPassword}
            />
          </label>
        </>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      <div className="pos-reversal-actions">
        <button className="pos-secondary-button" disabled={busy} type="submit">
          {busy ? "Working" : needsApproval ? "Approve & submit" : `Confirm ${actionLabel.toLowerCase()}`}
        </button>
        <button className="pos-secondary-button" disabled={busy} onClick={onClose} type="button">
          Cancel
        </button>
      </div>
    </form>
  );
}

class ReversalRequestError extends Error {}

function getApproverErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      return "Manager email or password is incorrect.";
    }

    if (error.code === "auth/too-many-requests") {
      return "Too many attempts. Try again later.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Manager approval failed.";
}
