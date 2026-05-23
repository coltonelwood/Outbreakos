# Swapping the in-memory store for Supabase

## What's already done

- `supabase/schema.sql` — all tables, indexes, RLS policies, plus the
  `leads` and `user_credentials` tables that were added in this round.
- `supabase/seed.sql` — Bundibugyo demo scenario, ready to load.
- `lib/supabase/server.ts` — server-side client factory (`supabaseAdmin()`
  for service role, `supabaseServer()` for anon, `isSupabaseConfigured()`
  for the swap-conditional).
- `scripts/migrate.mjs` — runnable migration helper.

## What's NOT yet done (be honest about this)

The `data` accessor object in `lib/store.ts` is still synchronous and reads
from the in-memory `db()` singleton. To use Supabase from end to end, the
following pure-mechanical refactor is required:

1. Convert every method on `data` to `async` and replace the array filter
   with a Supabase query, e.g.

   ```ts
   screenings: async (orgId: string) => {
     const { data, error } = await supabaseAdmin()
       .from("screenings")
       .select("*")
       .eq("org_id", orgId)
       .order("created_at", { ascending: false });
     if (error) throw error;
     return data as ScreeningRecord[];
   },
   ```

2. Convert mutation functions (`addScreening`, `addContact`, `addAlert`,
   `addReport`, `adjustResource`, `createSite`, `updateSite`,
   `updateSettings`, `addLead`, `logAudit`, `createOrg`, `createUser`,
   `verifyPassword`) similarly.

3. Add `await` to every call site — ~25 files in `app/dashboard/**/page.tsx`
   and every `app/api/**/route.ts`. The pages are already server components,
   so adding `await` is mechanical.

4. Map snake_case columns from Postgres back to camelCase in TypeScript
   (e.g. `org_id` → `orgId`, `created_at` → `createdAt`). Easiest is to add
   a `from()` wrapper that auto-maps; alternative is to alter the schema to
   use camelCase columns (less idiomatic SQL).

5. Verify against a real Supabase project with `npm run db:migrate` and a
   manual smoke test of every dashboard route.

## Why we didn't ship the swap in one go

Doing the await refactor blind, without an integration test against a real
Supabase URL, is the kind of change that breaks a demo at the worst possible
moment. The honest move is: ship the foundation, document the path, and do
the swap in a session where the developer has a Supabase project in front
of them.

## Recommended swap session checklist

- [ ] Create Supabase project; record URL + anon + service-role keys
- [ ] Run `supabase/schema.sql` in the Supabase SQL editor
- [ ] Run `supabase/seed.sql` (or skip and let the first signup populate)
- [ ] Set env vars locally: `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Refactor `lib/store.ts` per the pattern above
- [ ] Run typecheck (every missing `await` will be flagged)
- [ ] Add `await` at every call site
- [ ] Run `npm test` and the smoke test in `scripts/smoke.sh`
- [ ] Deploy to a Vercel preview, hit every route, confirm data persists
      across two requests from different geographic edges
- [ ] Flip prod env vars and ship

Estimated effort: 6-8 hours of focused work with the test infrastructure in
front of you.
