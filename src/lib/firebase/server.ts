import { applicationDefault, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";
import { publicEnv } from "@/lib/env/public";
import { isProductionAppEnv, serverEnv } from "@/lib/env/server";

export function getFirebaseAdminApp(): App | null {
  const projectId = publicEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? serverEnv.GOOGLE_CLOUD_PROJECT;

  if (!projectId && !serverEnv.GOOGLE_APPLICATION_CREDENTIALS) {
    return null;
  }

  if (getApps().length > 0) {
    return getApps()[0] ?? null;
  }

  try {
    return initializeApp({
      credential: applicationDefault(),
      projectId
    });
  } catch (error) {
    if (!isProductionAppEnv()) {
      return null;
    }

    throw error;
  }
}

export function getAdminAuth(): Auth | null {
  const app = getFirebaseAdminApp();
  return app ? getAuth(app) : null;
}

export function getAdminFirestore(): Firestore | null {
  const app = getFirebaseAdminApp();
  return app ? getFirestore(app) : null;
}

export function getAdminStorage(): Storage | null {
  const app = getFirebaseAdminApp();
  return app ? getStorage(app) : null;
}
