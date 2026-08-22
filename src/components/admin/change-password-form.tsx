"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  updatePassword
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";

const MIN_LENGTH = 8;

type FormState = "idle" | "submitting" | "success" | "error";

type ChangePasswordFormProps = {
  email: string;
  onPasswordChanged: () => Promise<void>;
};

export function ChangePasswordForm({ email, onPasswordChanged }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [authReady, setAuthReady] = useState(false);
  // React state updates aren't synchronous, so the `disabled` attribute
  // alone can't stop a second submit that lands before a re-render —
  // this ref guards re-entrancy the instant handleSubmit starts.
  const submittingRef = useRef(false);

  useEffect(() => {
    const auth = getClientAuth();
    if (!auth) {
      return;
    }

    // The server-side session cookie can be valid right after a fresh page
    // load while the client SDK is still asynchronously rehydrating its own
    // signed-in user from storage — checking auth.currentUser immediately
    // can see null even though the account really is signed in. Wait for
    // this to fire before trusting currentUser for reauthentication.
    return onAuthStateChanged(auth, (user) => {
      setAuthReady(Boolean(user));
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) {
      return;
    }

    setMessage("");

    if (newPassword.length < MIN_LENGTH) {
      setState("error");
      setMessage(`New password must be at least ${MIN_LENGTH} characters.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setState("error");
      setMessage("New password and confirmation don't match.");
      return;
    }

    if (newPassword === currentPassword) {
      setState("error");
      setMessage("New password must be different from your current password.");
      return;
    }

    const auth = getClientAuth();
    const user = auth?.currentUser;
    if (!auth || !user) {
      setState("error");
      setMessage("You're not signed in. Refresh the page and try again.");
      return;
    }

    submittingRef.current = true;
    setState("submitting");

    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(email, currentPassword));
      await updatePassword(user, newPassword);

      // Firebase auto-invalidates every other existing session for this
      // account the moment updatePassword() succeeds — the old session
      // cookie (including this tab's) is already dead at this point, so
      // re-sign-in immediately with the new password to re-establish this
      // tab's own session before doing anything else that needs it.
      const credential = await signInWithEmailAndPassword(auth, email, newPassword);
      const idToken = await credential.user.getIdToken();
      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });

      if (!sessionResponse.ok) {
        throw new Error("Password changed, but your session couldn't be refreshed. Sign in again.");
      }

      await onPasswordChanged();
      setState("success");
      setMessage("Password changed. You've been signed out everywhere else.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setState("error");
      setMessage(getChangePasswordErrorMessage(error));
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <fieldset disabled={!authReady || state === "submitting"}>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Current password</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              type="password"
              value={currentPassword}
            />
          </label>
          <label className="admin-field">
            <span>New password</span>
            <input
              autoComplete="new-password"
              minLength={MIN_LENGTH}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />
          </label>
          <label className="admin-field">
            <span>Confirm new password</span>
            <input
              autoComplete="new-password"
              minLength={MIN_LENGTH}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </label>
        </div>
        <button className="admin-action" type="submit">
          {state === "submitting" ? "Changing password" : "Change password"}
        </button>
      </fieldset>
      {!authReady ? <p className="admin-help">Loading your session…</p> : null}
      {message ? (
        <p className={state === "error" ? "form-error" : "admin-form-status success"}>{message}</p>
      ) : null}
    </form>
  );
}

function getChangePasswordErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
      return "Current password is incorrect.";
    }

    if (error.code === "auth/weak-password") {
      return "That password is too weak — choose a stronger one.";
    }

    if (error.code === "auth/too-many-requests") {
      return "Too many attempts. Wait a moment and try again.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Couldn't change your password. Try again.";
}
