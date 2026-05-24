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
  if (required && !isSupabaseConfigured()) {
    throw new PersistenceError(
      "REQUIRE_PERSISTENCE=true but no durable datastore is configured. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (and " +
        "complete the data-layer swap in supabase/SWAP.md). Refusing to serve " +
        "on the in-memory store in production.",
    );
  }
}

export function persistenceMode(): "durable" | "in-memory" {
  return isSupabaseConfigured() ? "durable" : "in-memory";
}
