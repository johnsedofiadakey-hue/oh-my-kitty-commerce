import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false }
};

export default function AdminLoginPage() {
  return (
    <main className="auth-page">
      <div className="auth-page-inner">
        <Link className="auth-back-link" href="/">
          <span aria-hidden="true">&larr;</span> Back to site
        </Link>
        <section className="auth-card" aria-labelledby="admin-login-title">
          <Link className="auth-logo" href="/">
            <Image
              src="/brand/oh-my-kitty-logo.jpeg"
              alt="Oh My Kitty logo"
              width={74}
              height={74}
              priority
            />
            <span>Oh My Kitty</span>
          </Link>
          <div className="auth-copy">
            <p>Staff access</p>
            <h1 id="admin-login-title">Sign in to admin</h1>
          </div>
          <AdminLoginForm />
        </section>
      </div>
    </main>
  );
}
