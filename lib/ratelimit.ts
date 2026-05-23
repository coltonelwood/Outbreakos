// Rate limiter with two backends:
// - In-process token bucket (default — survives within one Node process)
// - Upstash Redis (when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are
//   set — multi-instance safe)
//
// Both expose the same async result shape so call sites don't change.

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

// ---------------------------------------------------------------------------
// Upstash adapter — lazy-loaded so the package isn't required at runtime
// when no Redis is configured.
// ---------------------------------------------------------------------------

type UpstashRatelimit = {
  limit: (
    key: string,
  ) => Promise<{ success: boolean; remaining: number; reset: number }>;
};

const upstashCache = new Map<string, UpstashRatelimit>();
let upstashRedis: unknown = null;

function getUpstashRatelimit(opts: { limit: number; windowSec: number }): UpstashRatelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const cacheKey = `${opts.limit}:${opts.windowSec}`;
  const cached = upstashCache.get(cacheKey);
  if (cached) return cached;
  try {
    // Require synchronously to avoid bundler edge-cases in API route runtime.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Ratelimit } = require("@upstash/ratelimit");
    if (!upstashRedis) upstashRedis = new Redis({ url, token });
    const rl = new Ratelimit({
      redis: upstashRedis as object,
      limiter: Ratelimit.slidingWindow(opts.limit, `${opts.windowSec} s`),
      analytics: false,
      prefix: "outbreakos",
    });
    upstashCache.set(cacheKey, rl);
    return rl;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API — async so an Upstash backend can plug in transparently.
// ---------------------------------------------------------------------------

export async function rateLimitAsync(
  key: string,
  opts: { limit: number; windowSec: number },
): Promise<LimitResult> {
  const up = getUpstashRatelimit(opts);
  if (up) {
    try {
      const r = await up.limit(key);
      const retryMs = Math.max(0, r.reset - Date.now());
      return {
        ok: r.success,
        remaining: r.remaining,
        retryAfterSec: Math.ceil(retryMs / 1000),
      };
    } catch {
      // Fall through to local on Upstash failure rather than 500-ing the request.
    }
  }
  return rateLimit(key, opts);
}

// Synchronous in-process token bucket (kept for backward compat with existing
// callers; new code should prefer rateLimitAsync).
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
        "Retry-After": String(r.retryAfterSec || 1),
      },
    },
  );
}
