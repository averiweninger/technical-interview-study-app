import "server-only";
import { createHash } from "node:crypto";

/** Small process-local burst limit; production also needs Supabase and hosting-level limits. */
export function createAuthRateLimiter() {
  const buckets = new Map<string, { count: number; until: number }>();
  return (email: string, ip: string, now = Date.now()) => {
    for (const [key, bucket] of buckets) if (bucket.until <= now) buckets.delete(key);
    const limits = [[`email:${email.toLowerCase()}`, 10], [`ip:${ip}`, 60]] as const;
    const keys = limits.map(([value, limit]) => ({ key: createHash("sha256").update(value).digest("hex"), limit }));
    // Bound memory and fail closed rather than evicting active limits during an attack.
    if (buckets.size + keys.filter(({ key }) => !buckets.has(key)).length > 2000) return false;
    if (keys.some(({ key, limit }) => (buckets.get(key)?.count ?? 0) >= limit)) return false;
    for (const { key } of keys) {
      const bucket = buckets.get(key) ?? { count: 0, until: now + 10 * 60_000 };
      bucket.count += 1;
      buckets.set(key, bucket);
    }
    return true;
  };
}

export const allowAuthAttempt = createAuthRateLimiter();
