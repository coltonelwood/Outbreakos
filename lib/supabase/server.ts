// Server-only Supabase client factory.
//
// USAGE
//   const sb = supabaseAdmin();      // service-role (bypasses RLS)
//   const sb = supabaseServer();     // anon, no auth bridge yet
//
// NOTE on the data-layer swap (item 1 in the takeover prompt)
// -----------------------------------------------------------
// We have the Supabase client factory, the schema, the seed, and a runnable
// migration script. The remaining work to actually USE Supabase from every
// page is to convert lib/store.ts's `data` accessor and mutation functions to
// async, and add `await` at every call site (~25 files).
//
// That conversion is intentionally NOT shipped in this batch — doing it
// without an integration test environment is risky. The full swap path is
// documented in supabase/SWAP.md.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;
let _server: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "supabaseAdmin(): SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_URL) missing. Set them before calling Supabase code.",
    );
  }
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: noStoreFetch },
  });
  return _admin;
}

// Next.js patches the global fetch with caching/instrumentation in the server
// runtime, which corrupts supabase-js response handling (reads come back empty
// even though writes succeed). Forcing cache: "no-store" opts every Supabase
// request out of Next's fetch cache so responses are read correctly.
const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });

export function supabaseServer(): SupabaseClient {
  if (_server) return _server;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "supabaseServer(): NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing.",
    );
  }
  _server = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: noStoreFetch },
  });
  return _server;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
