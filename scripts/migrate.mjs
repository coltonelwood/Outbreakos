#!/usr/bin/env node
// Apply supabase/schema.sql against the project pointed at by
// NEXT_PUBLIC_SUPABASE_URL using SUPABASE_SERVICE_ROLE_KEY.
//
// Usage:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate.mjs
//
// Idempotent: the schema uses `create table if not exists` and `drop policy
// if exists` so re-running is safe.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const schemaPath = join(__dirname, "..", "supabase", "schema.sql");
const seedPath = join(__dirname, "..", "supabase", "seed.sql");

const wantSeed = process.argv.includes("--seed");
const files = [schemaPath, ...(wantSeed ? [seedPath] : [])];

for (const file of files) {
  const sql = readFileSync(file, "utf-8");
  console.log(`\n→ Applying ${file}`);
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`HTTP ${res.status}: ${text}`);
    console.error(
      "\nNOTE: Supabase does not expose an arbitrary SQL endpoint by default.",
    );
    console.error(
      "Recommended: copy supabase/schema.sql into the Supabase SQL editor and run it once, then re-run this script with --seed to load demo data.",
    );
    process.exit(1);
  }
  console.log(`  ✓ ${file} applied`);
}

console.log("\n✓ Migration complete.");
