#!/usr/bin/env node
// Apply supabase/schema.sql (and optionally seed.sql) to your Postgres /
// Supabase database via `psql`.
//
// Supabase does NOT expose a generic "run arbitrary SQL" REST endpoint, so the
// reliable, honest options are:
//   (a) psql against your connection string  <-- this script
//   (b) paste the SQL into the Supabase SQL editor by hand
//
// Usage:
//   SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" \
//     node scripts/migrate.mjs [--seed]
//
// Find the connection string in: Supabase Dashboard -> Project Settings ->
// Database -> Connection string (URI). Use the "Session" pooler or direct.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const wantSeed = process.argv.includes("--seed");

const schemaPath = join(__dirname, "..", "supabase", "schema.sql");
const seedPath = join(__dirname, "..", "supabase", "seed.sql");
const files = [schemaPath, ...(wantSeed ? [seedPath] : [])];

if (!dbUrl) {
  console.error(
    [
      "No SUPABASE_DB_URL / DATABASE_URL set.",
      "",
      "Option A (recommended): set the Postgres connection string and re-run:",
      '  SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" \\',
      "    node scripts/migrate.mjs --seed",
      "",
      "Option B: open the Supabase SQL editor and paste, in order:",
      `  1. ${schemaPath}`,
      `  2. ${seedPath}   (optional demo data)`,
    ].join("\n"),
  );
  process.exit(1);
}

let psqlOk = true;
try {
  execFileSync("psql", ["--version"], { stdio: "ignore" });
} catch {
  psqlOk = false;
}
if (!psqlOk) {
  console.error("`psql` not found on PATH. Install the Postgres client, or use the Supabase SQL editor (Option B above).");
  process.exit(1);
}

for (const file of files) {
  if (!existsSync(file)) {
    console.error(`Missing SQL file: ${file}`);
    process.exit(1);
  }
  console.log(`\n→ Applying ${file}`);
  try {
    execFileSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", file], {
      stdio: "inherit",
    });
    console.log(`  ✓ applied`);
  } catch {
    console.error(`  ✗ failed applying ${file}`);
    process.exit(1);
  }
}
console.log("\n✓ Migration complete. Now run: npm run verify:supabase");
