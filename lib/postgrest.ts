// Direct PostgREST client over raw fetch. We bypass supabase-js because its
// response handling returns empty results inside the Next.js production server
// runtime (writes persist, reads come back empty). Raw fetch against PostgREST
// is verified to work in this runtime. cache: "no-store" keeps Next from
// caching/instrumenting these requests.
//
// All requests use the service-role key (server-only). Tenant isolation is
// enforced by explicit org_id filters in lib/repo.ts; RLS remains the
// defense-in-depth backstop for any anon/client access.

function baseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL missing");
  return `${url.replace(/\/$/, "")}/rest/v1`;
}

function serviceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return key;
}

function authHeaders(): Record<string, string> {
  const key = serviceKey();
  return { apikey: key, Authorization: `Bearer ${key}` };
}

async function pgFetch(path: string, init: RequestInit): Promise<Response> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: { ...authHeaders(), ...(init.headers as Record<string, string>) },
  });
  return res;
}

async function pgError(res: Response): Promise<never> {
  let body = "";
  try {
    body = await res.text();
  } catch {
    /* ignore */
  }
  throw new Error(`PostgREST ${res.status}: ${body || res.statusText}`);
}

// GET rows. `query` is a PostgREST query string (without leading ?).
export async function pgSelect<T = Record<string, unknown>>(
  table: string,
  query: string,
): Promise<T[]> {
  const res = await pgFetch(`/${table}?${query}`, { method: "GET" });
  if (!res.ok) return pgError(res);
  return (await res.json()) as T[];
}

// INSERT rows, returning the created rows (Prefer: return=representation).
export async function pgInsert<T = Record<string, unknown>>(
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[],
): Promise<T[]> {
  const res = await pgFetch(`/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) return pgError(res);
  return (await res.json()) as T[];
}

// UPDATE rows matching `query`, returning the updated rows.
export async function pgUpdate<T = Record<string, unknown>>(
  table: string,
  query: string,
  patch: Record<string, unknown>,
): Promise<T[]> {
  const res = await pgFetch(`/${table}?${query}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return pgError(res);
  return (await res.json()) as T[];
}

// DELETE rows matching `query`.
export async function pgDelete(table: string, query: string): Promise<void> {
  const res = await pgFetch(`/${table}?${query}`, { method: "DELETE" });
  if (!res.ok) return pgError(res);
}

// Encode a value for a PostgREST filter (eq.<value>, ilike.<value>, etc.).
export function eq(value: string): string {
  return `eq.${encodeURIComponent(value)}`;
}
export function ilike(value: string): string {
  return `ilike.${encodeURIComponent(value)}`;
}
