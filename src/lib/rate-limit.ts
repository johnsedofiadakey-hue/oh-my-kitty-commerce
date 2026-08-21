type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 5000;

/**
 * Simple in-memory sliding-window rate limiter. Per Cloud Run instance,
 * not globally shared across instances — that's a real limitation under
 * multi-instance scaling, but it still raises the bar for the common case
 * (a single script or IP hammering a public endpoint) without adding new
 * infrastructure (Redis, a Firestore-backed counter) for a store this
 * size. Revisit if real abuse is observed.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [trackedKey, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(trackedKey);
      }
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

/** Best-effort client IP from the standard proxy header Cloud Run/Firebase Hosting sets — not spoof-proof, good enough to key a rate limit bucket. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return "unknown";
}
