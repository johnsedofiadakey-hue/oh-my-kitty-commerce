// Guest order history — lives only in this browser's localStorage, never
// sent to or read from the server. Lets a guest (no account) come back and
// see their own past order numbers on this device, without us storing any
// customer-identity link between browser and order server-side.
//
// Mirrors add-to-bag-button.tsx's cart store: a raw-string cache so repeated
// reads return the same array reference when nothing changed (required for
// useSyncExternalStore to not re-render in a loop), plus a same-tab custom
// event since the native "storage" event only fires in *other* tabs.
const STORAGE_KEY = "omk-order-history";
const CHANGED_EVENT = "omk-order-history-changed";
const MAX_ENTRIES = 30;
const emptyHistory: SavedOrder[] = [];
let cachedRaw: string | null = null;
let cachedHistory: SavedOrder[] = emptyHistory;

export type SavedOrder = {
  orderNumber: string;
  total: number;
  createdAt: string;
};

function isSavedOrder(value: unknown): value is SavedOrder {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as SavedOrder).orderNumber === "string" &&
    typeof (value as SavedOrder).total === "number" &&
    typeof (value as SavedOrder).createdAt === "string"
  );
}

export function getOrderHistory(): SavedOrder[] {
  if (typeof window === "undefined") {
    return emptyHistory;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedHistory;
    }

    const parsed = raw ? JSON.parse(raw) : [];
    cachedRaw = raw;
    cachedHistory = Array.isArray(parsed) ? parsed.filter(isSavedOrder) : emptyHistory;
    return cachedHistory;
  } catch {
    return emptyHistory;
  }
}

function writeOrderHistory(next: SavedOrder[]) {
  const raw = JSON.stringify(next);
  cachedRaw = raw;
  cachedHistory = next;

  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Private browsing / storage disabled / quota exceeded — the order still
    // went through server-side, the customer just won't see it listed here.
  }

  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function saveOrderToHistory(order: SavedOrder) {
  if (typeof window === "undefined") {
    return;
  }

  const existing = getOrderHistory().filter((entry) => entry.orderNumber !== order.orderNumber);
  writeOrderHistory([order, ...existing].slice(0, MAX_ENTRIES));
}

export function removeOrderFromHistory(orderNumber: string) {
  if (typeof window === "undefined") {
    return;
  }

  writeOrderHistory(getOrderHistory().filter((entry) => entry.orderNumber !== orderNumber));
}

export function onOrderHistoryChanged(listener: () => void) {
  window.addEventListener(CHANGED_EVENT, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(CHANGED_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function getServerOrderHistorySnapshot(): SavedOrder[] {
  return emptyHistory;
}
