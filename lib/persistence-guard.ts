// Production persistence guard.
//
// The in-memory store is acceptable ONLY for local dev and the seeded demo.
// In a real production deployment, running on RAM means data loss on every
// cold start and inconsistency across instances. To make that mistake
// impossible, set REQUIRE_PERSISTENCE=true in production: the app will refuse
// to serve if a durable backend (Supabase) is not configured.
//
// We gate this behind an explicit flag rather than NODE_ENV so the existing
// demo deployment keeps working until the Supabase swap (supabase/SWAP.md) is
// complete — at which point you set REQUIRE_PERSISTENCE=true and the unsafe
// mode is locked out for good.

import { isSupabaseConfigured } from "./supabase/server";

export class PersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistenceError";
  }
}

export function assertPersistence() {
  const required = process.env.REQUIRE_PERSISTENCE === "true";
  if (!required) return;

  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.SESSION_SECRET) missing.push("SESSION_SECRET");

  if (missing.length > 0) {
    throw new PersistenceError(
      `REQUIRE_PERSISTENCE=true but required production env vars are missing: ${missing.join(", ")}. ` +
        "Refusing to serve on the in-memory store. Configure these and complete " +
        "the data-layer swap (supabase/SWAP.md), then run `npm run verify:supabase`.",
    );
  }
}

export function persistenceMode(): "durable" | "in-memory" {
  return isSupabaseConfigured() ? "durable" : "in-memory";
}
