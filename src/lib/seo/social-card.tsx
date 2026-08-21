import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const socialCardSize = { width: 1200, height: 630 };

let cachedLogoDataUrl: string | null = null;

function logoDataUrl() {
  if (!cachedLogoDataUrl) {
    const logoPath = join(process.cwd(), "public", "brand", "oh-my-kitty-logo.jpeg");
    const base64 = readFileSync(logoPath).toString("base64");
    cachedLogoDataUrl = `data:image/jpeg;base64,${base64}`;
  }

  return cachedLogoDataUrl;
}

/** The default share-link card for every page that doesn't set its own (product pages use their own photo instead). */
export function buildSocialCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "28px",
          position: "relative",
          background: "linear-gradient(135deg, #fff9f6 0%, #fdebe6 55%, #fad8d0 100%)"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background: "rgba(243, 169, 157, 0.35)",
            display: "flex"
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-140px",
            left: "-140px",
            width: "380px",
            height: "380px",
            borderRadius: "50%",
            background: "rgba(133, 147, 115, 0.18)",
            display: "flex"
          }}
        />
        <div
          style={{
            width: "176px",
            height: "176px",
            borderRadius: "50%",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 18px 40px rgba(17,17,17,0.12)"
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori (next/og) renders its own image pipeline, not the browser's */}
          <img
            alt=""
            src={logoDataUrl()}
            width={150}
            height={150}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        </div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 900, color: "#111111", letterSpacing: "-0.02em" }}>
          Oh My Kitty
        </div>
        <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#746964" }}>
          Intimate care, naturally.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "6px",
            fontSize: 20,
            fontWeight: 700,
            color: "#556b45",
            background: "#e6ecdd",
            padding: "8px 22px",
            borderRadius: "999px"
          }}
        >
          Accra, Ghana · Shop online, WhatsApp, or pickup
        </div>
      </div>
    ),
    { ...socialCardSize }
  );
}
