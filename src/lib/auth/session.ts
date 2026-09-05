import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { isProductionAppEnv } from "@/lib/env/server";

export const adminSessionCookieName = "__session";
// 14 days is Firebase's own hard ceiling for createSessionCookie's
// expiresIn — it cannot be set any longer than this. SessionKeepAlive
// silently mints a fresh cookie well before this runs out as long as she's
// still signed in on the device, so in practice she stays signed in
// indefinitely; this cap only bites if the device goes untouched for the
// full 14 days.
export const adminSessionMaxAgeMs = 1000 * 60 * 60 * 24 * 14;

export function getAdminSessionCookieOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    maxAge: adminSessionMaxAgeMs / 1000,
    path: "/",
    sameSite: "lax",
    secure: isProductionAppEnv()
  };
}
