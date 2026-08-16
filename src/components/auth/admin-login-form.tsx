"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";

type LoginState = "idle" | "submitting" | "success" | "error";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<LoginState>("idle");
  const [message, setMessage] = useState("");

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
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setState("success");
      setMessage("Signed in. Opening admin.");
      router.replace("/admin");
    } catch (error) {
      setState("error");
      setMessage(getLoginErrorMessage(error));
    }
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

  return "Sign in failed. Check the account and try again.";
}
