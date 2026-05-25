#!/usr/bin/env bash
# One-shot Vercel production env setup for OutbreakOS.
#
# Prereqs (your authenticated session — only you can do these):
#   npm i -g vercel
#   vercel login
#   vercel link            # pick the coltonelwood/outbreakos project
#
# Then run:
#   # provide the three Supabase values (from Supabase Dashboard -> Settings -> API)
#   export NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
#   export NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
#   export SUPABASE_SERVICE_ROLE_KEY="..."          # use the ROTATED key (see below)
#   export RESEND_API_KEY="..."                     # optional, for live emails
#   bash scripts/deploy-env.sh
#
# SESSION_SECRET and CRON_SECRET are generated here and never printed or stored.

set -euo pipefail

command -v vercel >/dev/null || { echo "Install the Vercel CLI: npm i -g vercel"; exit 1; }

require() { [ -n "${!1:-}" ] || { echo "Missing env var: $1"; exit 1; }; }
require NEXT_PUBLIC_SUPABASE_URL
require NEXT_PUBLIC_SUPABASE_ANON_KEY
require SUPABASE_SERVICE_ROLE_KEY

# Generated locally; only Vercel ever sees these values.
SESSION_SECRET="$(openssl rand -base64 48)"
CRON_SECRET="$(openssl rand -base64 32)"

set_var() {
  local name="$1" value="$2"
  # remove any existing value first so this is idempotent (ignore errors)
  printf 'y\n' | vercel env rm "$name" production >/dev/null 2>&1 || true
  printf '%s' "$value" | vercel env add "$name" production >/dev/null
  echo "  set $name"
}

echo "Setting Vercel production env vars..."
set_var NEXT_PUBLIC_SUPABASE_URL "$NEXT_PUBLIC_SUPABASE_URL"
set_var NEXT_PUBLIC_SUPABASE_ANON_KEY "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
set_var SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY"
set_var SESSION_SECRET "$SESSION_SECRET"
set_var CRON_SECRET "$CRON_SECRET"
set_var REQUIRE_PERSISTENCE "true"
set_var NEXT_PUBLIC_DEMO_MODE "false"
if [ -n "${RESEND_API_KEY:-}" ]; then
  set_var RESEND_API_KEY "$RESEND_API_KEY"
  set_var EMAIL_FROM "${EMAIL_FROM:-alerts@outbreakos.io}"
fi

echo ""
echo "Done. Now deploy with the new env baked in (NEXT_PUBLIC_* must be present at build time):"
echo "  vercel --prod --force"
echo ""
echo "After deploy, verify the cron is registered: Vercel Dashboard -> your project -> Settings -> Cron Jobs (expect /api/cron hourly)."
