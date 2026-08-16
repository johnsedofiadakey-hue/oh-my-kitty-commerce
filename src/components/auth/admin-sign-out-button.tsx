"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";

export function AdminSignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const auth = getClientAuth();
    if (auth) {
      await signOut(auth).catch(() => undefined);
    }

    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
    router.replace("/admin/login");
  }

  return (
    <button className="nav-item nav-button" onClick={handleSignOut} type="button">
      Sign out
    </button>
  );
}
