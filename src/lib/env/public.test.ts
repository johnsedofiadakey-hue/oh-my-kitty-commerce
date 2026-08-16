import { describe, expect, it } from "vitest";
import { getFirebasePublicConfig, hasFirebasePublicConfig } from "@/lib/env/public";

describe("public environment", () => {
  it("treats placeholders as missing Firebase config", () => {
    expect(
      hasFirebasePublicConfig({
        NEXT_PUBLIC_FIREBASE_API_KEY: "replace-later",
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "replace-later.firebaseapp.com",
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: "replace-later",
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "replace-later.appspot.com",
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "replace-later",
        NEXT_PUBLIC_FIREBASE_APP_ID: "replace-later"
      })
    ).toBe(false);
  });

  it("returns null config until all required Firebase values are usable", () => {
    expect(getFirebasePublicConfig({})).toBeNull();
  });
});
