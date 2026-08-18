import { openDB, type DBSchema, type IDBPDatabase } from "idb";

/**
 * IndexedDB-backed queue for POS sales made while offline. Replayed by
 * pos-sale-client.tsx on reconnect (online event, tab regaining focus, and
 * on mount) — there's no service-worker-side Background Sync handler, since
 * that API has no Safari/iOS support and the page-level listeners already
 * cover the real scenario (staff has the POS tab open through their shift).
 */

export type PendingSaleRequest = {
  amountReceived?: number;
  customer: { name: string; phone: string };
  items: { productId: string; variantId: string; quantity: number }[];
  paymentMethod: "cash" | "mobile_money" | "manual_transfer";
  posShiftId: string;
};

export type PendingAction = {
  id: string;
  createdAt: number;
  status: "pending" | "failed";
  attempts: number;
  lastError?: string;
  request: PendingSaleRequest;
};

export const QUEUE_CHANGED_EVENT = "omk-pos-queue-changed";

interface PosOfflineDb extends DBSchema {
  pendingSales: {
    key: string;
    value: PendingAction;
    indexes: { "by-createdAt": number };
  };
}

let dbPromise: Promise<IDBPDatabase<PosOfflineDb>> | null = null;

function getDb() {
  if (typeof indexedDB === "undefined") {
    return null;
  }

  if (!dbPromise) {
    dbPromise = openDB<PosOfflineDb>("omk-pos-offline", 1, {
      upgrade(db) {
        const store = db.createObjectStore("pendingSales", { keyPath: "id" });
        store.createIndex("by-createdAt", "createdAt");
      }
    });
  }

  return dbPromise;
}

function notifyQueueChanged() {
  if (typeof self !== "undefined") {
    self.dispatchEvent(new Event(QUEUE_CHANGED_EVENT));
  }
}

export async function enqueueSale(id: string, request: PendingSaleRequest) {
  const db = await getDb();
  if (!db) {
    return;
  }

  await db.put("pendingSales", {
    id,
    createdAt: Date.now(),
    status: "pending",
    attempts: 0,
    request
  });
  notifyQueueChanged();
}

export async function listPendingSales(): Promise<PendingAction[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db.getAllFromIndex("pendingSales", "by-createdAt");
}

async function removeSale(id: string) {
  const db = await getDb();
  if (!db) {
    return;
  }

  await db.delete("pendingSales", id);
}

async function markSaleFailed(action: PendingAction, error: string) {
  const db = await getDb();
  if (!db) {
    return;
  }

  await db.put("pendingSales", {
    ...action,
    status: "failed",
    attempts: action.attempts + 1,
    lastError: error
  });
}

export function onQueueChanged(listener: () => void) {
  self.addEventListener(QUEUE_CHANGED_EVENT, listener);
  return () => self.removeEventListener(QUEUE_CHANGED_EVENT, listener);
}

export type ReplayResult = {
  synced: string[];
  failed: { id: string; error: string }[];
  stillOffline: boolean;
};

/**
 * Replays queued sales against /api/pos/sale in the order they were created.
 * A network failure stops the loop (still offline) rather than marking every
 * remaining item failed. A response the server explicitly rejected (bad
 * request, out of stock, forbidden) is terminal — retrying it would just fail
 * the same way, so it's marked "failed" for staff to see, not retried again.
 */
export async function replayPendingSales(): Promise<ReplayResult> {
  const pending = (await listPendingSales()).filter((action) => action.status === "pending");
  const synced: string[] = [];
  const failed: { id: string; error: string }[] = [];
  let stillOffline = false;

  for (const action of pending) {
    try {
      const response = await fetch("/api/pos/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...action.request, idempotencyKey: action.id })
      });

      if (response.ok) {
        await removeSale(action.id);
        synced.push(action.id);
        continue;
      }

      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      const message = payload.message ?? `Sync failed (${response.status})`;
      await markSaleFailed(action, message);
      failed.push({ id: action.id, error: message });
    } catch {
      stillOffline = true;
      break;
    }
  }

  if (synced.length > 0 || failed.length > 0) {
    notifyQueueChanged();
  }

  return { synced, failed, stillOffline };
}
