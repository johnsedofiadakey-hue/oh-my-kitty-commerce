"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";

type LoginState = "idle" | "submitting" | "success" | "error";
type ResetState = "idle" | "submitting" | "sent" | "error";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<LoginState>("idle");
  const [message, setMessage] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetState, setResetState] = useState<ResetState>("idle");
  const [resetMessage, setResetMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    const auth = getClientAuth();
    if (!auth) {
      setState("error");
      setMessage("Firebase is not configured for this environment yet.");
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await credential.user.getIdToken();
      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ idToken })
      });

      if (!sessionResponse.ok) {
        await signOut(auth);
        const body = (await sessionResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Admin session could not be created.");
      }

      setState("success");
      setMessage("Signed in. Opening admin.");
      router.replace("/admin");
    } catch (error) {
      setState("error");
      setMessage(getLoginErrorMessage(error));
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetState("submitting");
    setResetMessage("");

    const auth = getClientAuth();
    if (!auth) {
      setResetState("error");
      setResetMessage("Firebase is not configured for this environment yet.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      if (!(error instanceof FirebaseError) || error.code !== "auth/user-not-found") {
        setResetState("error");
        setResetMessage(getLoginErrorMessage(error));
        return;
      }
      // Don't reveal whether the email has an account — same message either way.
    }

    setResetState("sent");
    setResetMessage("If that email has an admin account, a reset link is on its way.");
  }

  if (showReset) {
    return (
      <form className="auth-form" onSubmit={handleReset}>
        <label className="form-field">
          <span>Email</span>
          <input
            autoComplete="email"
            inputMode="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <button className="auth-submit" disabled={resetState === "submitting"} type="submit">
          {resetState === "submitting" ? "Sending" : "Send reset link"}
        </button>
        {resetMessage ? (
          <p className={`auth-message ${resetState === "error" ? "error" : ""}`} role="status">
            {resetMessage}
          </p>
        ) : null}
        <button
          className="auth-link"
          onClick={() => {
            setShowReset(false);
            setResetState("idle");
            setResetMessage("");
          }}
          type="button"
        >
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="form-field">
        <span>Email</span>
        <input
          autoComplete="email"
          inputMode="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      <label className="form-field">
        <span>Password</span>
        <input
          autoComplete="current-password"
          minLength={6}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      <button className="auth-submit" disabled={state === "submitting"} type="submit">
        {state === "submitting" ? "Signing in" : "Sign in"}
      </button>
      {message ? (
        <p className={`auth-message ${state === "error" ? "error" : ""}`} role="status">
          {message}
        </p>
      ) : null}
      <button className="auth-link" onClick={() => setShowReset(true)} type="button">
        Forgot password?
      </button>
    </form>
  );
}

function getLoginErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      return "Email or password is incorrect.";
    }

    if (error.code === "auth/too-many-requests") {
      return "Too many attempts. Try again later.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Sign in failed. Check the account and try again.";
}
