"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function StorefrontError({
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
    <main className="legal-page">
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">Error</span>
        <h1>Something went wrong.</h1>
        <div className="legal-card">
          <section data-section-number="01">
            <h2>Let&apos;s try that again</h2>
            <p>This page hit a snag loading. Your cart and any completed order are unaffected.</p>
            <div className="step-row">
              <button className="checkout-cta" onClick={() => reset()} type="button">
                <span>Try again</span>
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
