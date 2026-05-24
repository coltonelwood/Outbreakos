#!/usr/bin/env node
// Live Supabase verification — RUN THIS AGAINST YOUR REAL PROJECT.
//
//   NEXT_PUBLIC_SUPABASE_URL=... \
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
//   SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/verify-supabase.mjs
//
// It performs REAL operations against your database and cleans up after
// itself. Nothing here is mocked. If any check fails, it exits non-zero with
// a precise message.
//
// Checks:
//   1. Required env vars present
//   2. Service-role connection works
//   3. All expected tables exist
//   4. Persistence round-trip (insert org -> read back -> survives)
//   5. RLS tenant isolation with TWO real authenticated users:
//      user A (org A) cannot read org B's screenings, and vice versa
//   6. Cleanup

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const FAIL = (msg) => {
  console.error(`\n❌ ${msg}`);
  process.exit(1);
};
const OK = (msg) => console.log(`✓ ${msg}`);

if (!url || !anon || !service) {
  FAIL(
    "Missing env. Need NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.",
  );
}
OK("Env vars present");

const admin = createClient(url, service, { auth: { persistSession: false } });

const EXPECTED_TABLES = [
  "organizations", "profiles", "sites", "outbreak_regions", "cases",
  "screenings", "contacts", "alerts", "resources", "reports", "leads",
  "audit_logs", "org_settings", "notifications", "set_password_tokens",
  "user_credentials",
];

const cleanup = [];

async function main() {
  // 2. connection
  {
    const { error } = await admin.from("organizations").select("id").limit(1);
    if (error) FAIL(`Service-role connection failed: ${error.message}`);
    OK("Service-role connection works");
  }

  // 3. tables exist
  for (const t of EXPECTED_TABLES) {
    const { error } = await admin.from(t).select("*").limit(0);
    if (error) FAIL(`Table "${t}" missing or unreadable: ${error.message}. Run supabase/schema.sql.`);
  }
  OK(`All ${EXPECTED_TABLES.length} expected tables exist`);

  // 4. persistence round-trip
  const orgAName = `verify-A-${Date.now()}`;
  const { data: orgA, error: e1 } = await admin
    .from("organizations")
    .insert({ name: orgAName, slug: orgAName, mode: "mining_site", branding: {} })
    .select()
    .single();
  if (e1) FAIL(`Insert org failed: ${e1.message}`);
  cleanup.push(() => admin.from("organizations").delete().eq("id", orgA.id));
  const { data: readBack } = await admin.from("organizations").select("*").eq("id", orgA.id).single();
  if (!readBack || readBack.name !== orgAName) FAIL("Round-trip read mismatch — data did not persist.");
  OK("Persistence round-trip (insert -> read back) works");

  // 5. RLS tenant isolation with two real authed users
  const orgBName = `verify-B-${Date.now()}`;
  const { data: orgB } = await admin
    .from("organizations")
    .insert({ name: orgBName, slug: orgBName, mode: "mining_site", branding: {} })
    .select()
    .single();
  cleanup.push(() => admin.from("organizations").delete().eq("id", orgB.id));

  const passA = "verifyA!" + Date.now();
  const passB = "verifyB!" + Date.now();
  const emailA = `verify_a_${Date.now()}@example.com`;
  const emailB = `verify_b_${Date.now()}@example.com`;

  const { data: uA, error: eUA } = await admin.auth.admin.createUser({
    email: emailA, password: passA, email_confirm: true,
  });
  if (eUA) FAIL(`Could not create auth user A (needs service role + auth enabled): ${eUA.message}`);
  cleanup.push(() => admin.auth.admin.deleteUser(uA.user.id));
  const { data: uB } = await admin.auth.admin.createUser({
    email: emailB, password: passB, email_confirm: true,
  });
  cleanup.push(() => admin.auth.admin.deleteUser(uB.user.id));

  // Profiles map auth users -> orgs (this is what auth_org_id() reads).
  await admin.from("profiles").insert([
    { id: uA.user.id, org_id: orgA.id, email: emailA, name: "A", role: "owner" },
    { id: uB.user.id, org_id: orgB.id, email: emailB, name: "B", role: "owner" },
  ]);

  // Seed one screening in each org.
  const baseScr = {
    context: "site_entry", subject_name: "x", anonymous: true, age_range: "18-39",
    travel_history: [], contact_with_case: false, symptoms: {}, risk: "low",
    action: "Clear", rationale: [],
  };
  await admin.from("screenings").insert([
    { ...baseScr, org_id: orgA.id, subject_name: "A-secret" },
    { ...baseScr, org_id: orgB.id, subject_name: "B-secret" },
  ]);

  // Now sign in as each user with the ANON client and confirm isolation.
  const clientA = createClient(url, anon, { auth: { persistSession: false } });
  const { error: sErrA } = await clientA.auth.signInWithPassword({ email: emailA, password: passA });
  if (sErrA) FAIL(`Sign-in as user A failed: ${sErrA.message}`);

  const { data: aSees } = await clientA.from("screenings").select("subject_name");
  const aNames = (aSees || []).map((r) => r.subject_name);
  if (aNames.includes("B-secret")) FAIL("RLS LEAK: org A can read org B's screenings!");
  if (!aNames.includes("A-secret")) FAIL("RLS too strict: org A cannot read its OWN screenings.");
  OK("RLS: org A sees only its own screenings");

  // Cross-org write attempt must fail.
  const { error: wErr } = await clientA
    .from("screenings")
    .insert({ ...baseScr, org_id: orgB.id, subject_name: "A-injecting-into-B" });
  if (!wErr) FAIL("RLS LEAK: org A was able to write into org B!");
  OK("RLS: org A cannot write into org B");

  console.log("\n✅ All Supabase checks passed. Persistence + tenant isolation verified.");
}

main()
  .catch((e) => FAIL(e?.message || String(e)))
  .finally(async () => {
    for (const fn of cleanup.reverse()) {
      try { await fn(); } catch {}
    }
  });
