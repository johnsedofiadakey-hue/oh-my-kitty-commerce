import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";
import {
  getFirebasePublicConfig,
  hasFirebasePublicConfig,
  shouldUseFirebaseEmulators
} from "@/lib/env/public";

let emulatorsConnected = false;

export function getFirebaseClientApp(): FirebaseApp | null {
  if (!hasFirebasePublicConfig()) {
    return null;
  }

  if (getApps().length > 0) {
    return getApp();
  }

  const config = getFirebasePublicConfig();
  return config ? initializeApp(config) : null;
}

export function getClientAuth(): Auth | null {
  const app = getFirebaseClientApp();
  if (!app) {
    return null;
  }

  const auth = getAuth(app);
  connectClientEmulators(auth);
  return auth;
}

export function getClientFirestore(): Firestore | null {
  const app = getFirebaseClientApp();
  if (!app) {
    return null;
  }

  const firestore = getFirestore(app);
  connectClientEmulators(undefined, firestore);
  return firestore;
}

export function getClientStorage(): FirebaseStorage | null {
  const app = getFirebaseClientApp();
  if (!app) {
    return null;
  }

  const storage = getStorage(app);
  connectClientEmulators(undefined, undefined, storage);
  return storage;
}

/**
 * Firebase Storage rules read custom claims (isStaff/isAdmin) off the ID
 * token, but the client SDK doesn't always proactively refresh a
 * long-cached token before a write — an admin whose tab has been open a
 * while can end up making Storage requests with a stale token even though
 * they're genuinely signed in, and get a confusing storage/unauthorized
 * error. Call this right before any Storage write to force a fresh token.
 */
export async function refreshClientIdToken(): Promise<void> {
  const auth = getClientAuth();
  if (auth?.currentUser) {
    await auth.currentUser.getIdToken(true);
  }
}

function connectClientEmulators(
  auth?: Auth,
  firestore?: Firestore,
  storage?: FirebaseStorage
) {
  if (!shouldUseFirebaseEmulators() || emulatorsConnected) {
    return;
  }

  if (auth) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }

  if (firestore) {
    connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
  }

  if (storage) {
    connectStorageEmulator(storage, "127.0.0.1", 9199);
  }

  emulatorsConnected = true;
}
