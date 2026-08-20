import { createRequire } from "node:module";
import { Timestamp } from "firebase-admin/firestore";
import { defaultRoles } from "../src/lib/permissions/permissions";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");

loadEnvConfig(process.cwd());

const ownerUid = process.env.BOOTSTRAP_OWNER_UID;
const ownerEmail = process.env.BOOTSTRAP_OWNER_EMAIL;
const ownerDisplayName = process.env.BOOTSTRAP_OWNER_DISPLAY_NAME ?? "Owner";
const ownerRoleId = "role-owner";

async function bootstrapOwner() {
  assertRequiredEnv("BOOTSTRAP_OWNER_UID", ownerUid);
  assertRequiredEnv("BOOTSTRAP_OWNER_EMAIL", ownerEmail);

  const { getAdminAuth, getAdminFirestore } = await import("../src/lib/firebase/server");
  const auth = getAdminAuth();
  const db = getAdminFirestore();

  if (!auth || !db) {
    throw new Error(
      "Firebase Admin is unavailable. Provide Google Application Default Credentials, a local service-account path, or emulator settings before running this script."
    );
  }

  const now = Timestamp.now();
  const batch = db.batch();

  for (const role of defaultRoles) {
    batch.set(
      db.collection("roles").doc(role.id),
      {
        ...role,
        createdAt: now,
        updatedAt: now
      },
      { merge: true }
    );
  }

  batch.set(
    db.collection("users").doc(ownerUid),
    {
      uid: ownerUid,
      displayName: ownerDisplayName,
      email: ownerEmail,
      status: "ACTIVE",
      roleIds: [ownerRoleId],
      type: "ADMIN_OR_STAFF",
      posEnabled: true,
      createdBy: "system:owner-bootstrap",
      createdAt: now,
      updatedAt: now
    },
    { merge: true }
  );

  batch.set(db.collection("auditLogs").doc(`owner-bootstrap-${ownerUid}`), {
    actorId: "system:owner-bootstrap",
    action: "users.bootstrap_owner",
    entityType: "user",
    entityId: ownerUid,
    summary: "Bootstrapped the initial owner account and default roles.",
    createdAt: now
  });

  await batch.commit();

  await auth.setCustomUserClaims(ownerUid, {
    isAdmin: true,
    isStaff: true,
    roleIds: [ownerRoleId],
    posEnabled: true,
    permissionsVersion: 1
  });

  console.log(`Bootstrapped owner access for ${ownerEmail}.`);
}

function assertRequiredEnv(name: string, value: string | undefined): asserts value is string {
  if (!value?.trim()) {
    throw new Error(`${name} is required. Add it to .env.local or pass it when running the script.`);
  }
}

bootstrapOwner().catch((error) => {
  console.error(getBootstrapErrorMessage(error));
  process.exit(1);
});

function getBootstrapErrorMessage(error: unknown) {
  if (isFirebaseServiceDisabledError(error)) {
    return "Cloud Firestore is disabled for this Firebase project. Enable Cloud Firestore in Firebase Console, wait a few minutes, then rerun npm run bootstrap:owner.";
  }

  if (isFirebasePermissionDeniedError(error)) {
    const detail = error.details ?? error.message;
    return `Firebase Admin permission denied. ${detail}`;
  }

  return error instanceof Error ? error.message : String(error);
}

function isFirebaseServiceDisabledError(error: unknown): error is FirebaseAdminRuntimeError {
  return (
    isFirebaseAdminRuntimeError(error) &&
    (error.reason === "SERVICE_DISABLED" ||
      error.details?.includes("firestore.googleapis.com") ||
      error.message.includes("Firestore API"))
  );
}

function isFirebasePermissionDeniedError(error: unknown): error is FirebaseAdminRuntimeError {
  return isFirebaseAdminRuntimeError(error) && (error.code === 7 || error.message.includes("PERMISSION_DENIED"));
}

function isFirebaseAdminRuntimeError(error: unknown): error is FirebaseAdminRuntimeError {
  return error instanceof Error;
}

type FirebaseAdminRuntimeError = Error & {
  code?: number;
  details?: string;
  reason?: string;
};
