"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            display: "grid",
            placeItems: "center",
            minHeight: "100svh",
            padding: "24px",
            fontFamily:
              "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            background: "#fff9f6",
            color: "#111"
          }}
        >
          <div style={{ maxWidth: "420px", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.4rem", marginBottom: "8px" }}>Something went wrong.</h1>
            <p style={{ color: "#746964", marginBottom: "20px" }}>
              Please try again, or come back in a moment. If this keeps happening, message us on
              WhatsApp.
            </p>
            <button
              onClick={() => reset()}
              style={{
                border: "none",
                borderRadius: "999px",
                padding: "12px 24px",
                background: "#111111",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer"
              }}
              type="button"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
