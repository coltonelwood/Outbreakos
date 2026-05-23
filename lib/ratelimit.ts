// In-process token-bucket rate limiter. Survives across requests in the same
// process; for multi-instance deployment swap in @upstash/ratelimit (the
// interface is intentionally identical to ease migration).

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const g = globalThis as unknown as { __outbreakos_buckets?: Map<string, Bucket> };
if (!g.__outbreakos_buckets) g.__outbreakos_buckets = new Map();
const buckets = g.__outbreakos_buckets;

export interface LimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(
  key: string,
  opts: { limit: number; windowSec: number },
): LimitResult {
  const now = Date.now();
  const refillPerMs = opts.limit / (opts.windowSec * 1000);
  const b = buckets.get(key) ?? { tokens: opts.limit, updatedAt: now };
  const elapsed = now - b.updatedAt;
  b.tokens = Math.min(opts.limit, b.tokens + elapsed * refillPerMs);
  b.updatedAt = now;
  if (b.tokens < 1) {
    const need = 1 - b.tokens;
    const retryMs = need / refillPerMs;
    buckets.set(key, b);
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil(retryMs / 1000) };
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return { ok: true, remaining: Math.floor(b.tokens), retryAfterSec: 0 };
}

export function clientKey(req: Request, prefix: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `${prefix}:${ip}`;
}

export function rateLimitResponse(r: LimitResult) {
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded", retryAfterSec: r.retryAfterSec }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(r.retryAfterSec),
      },
    },
  );
}
