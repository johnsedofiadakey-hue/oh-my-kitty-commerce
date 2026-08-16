import { NextResponse, type NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/server";
import {
  adminSessionCookieName,
  adminSessionMaxAgeMs,
  getAdminSessionCookieOptions
} from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const auth = getAdminAuth();
  if (!auth) {
    return NextResponse.json(
      { error: "Firebase Admin is not configured for sessions yet." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as { idToken?: unknown } | null;
  if (typeof body?.idToken !== "string" || !body.idToken.trim()) {
    return NextResponse.json({ error: "Missing Firebase ID token." }, { status: 400 });
  }

  const decoded = await auth.verifyIdToken(body.idToken);
  if (decoded.isAdmin !== true) {
    return NextResponse.json({ error: "This account is not an admin." }, { status: 403 });
  }

  const sessionCookie = await auth.createSessionCookie(body.idToken, {
    expiresIn: adminSessionMaxAgeMs
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookieName, sessionCookie, getAdminSessionCookieOptions());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookieName, "", {
    ...getAdminSessionCookieOptions(),
    maxAge: 0
  });
  return response;
}
