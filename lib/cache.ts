// Simple per-key TTL cache. Used to prevent repeat AI calls on every
// dashboard load. Process-local; for multi-instance swap for Redis.

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const g = globalThis as unknown as { __outbreakos_cache?: Map<string, Entry<unknown>> };
if (!g.__outbreakos_cache) g.__outbreakos_cache = new Map();
const cache = g.__outbreakos_cache;

export async function withCache<T>(
  key: string,
  ttlSec: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key) as Entry<T> | undefined;
  if (entry && entry.expiresAt > now) return entry.value;
  const value = await loader();
  cache.set(key, { value, expiresAt: now + ttlSec * 1000 });
  return value;
}

export function invalidate(prefix: string) {
  for (const k of Array.from(cache.keys())) {
    if (k.startsWith(prefix)) cache.delete(k);
  }
}
