import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { isProductionAppEnv } from "@/lib/env/server";

export const adminSessionCookieName = "__session";
export const adminSessionMaxAgeMs = 1000 * 60 * 60 * 24 * 5;

export function getAdminSessionCookieOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    maxAge: adminSessionMaxAgeMs / 1000,
    path: "/",
    sameSite: "lax",
    secure: isProductionAppEnv()
  };
}
