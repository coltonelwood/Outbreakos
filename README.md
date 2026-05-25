# OutbreakOS

**Operational health-security infrastructure for high-risk workforces.**
Screening, contact monitoring, resource logistics, AI briefings, and executive
reporting — built first for mining and industrial operators, with adjacent
deployments for airports, hospitals, NGOs, and governments.

> OutbreakOS is **not** a medical diagnostic device. It supports operational
> screening, contact monitoring, logistics, and reporting workflows.
> Clinical decisions are made by qualified health authorities.

---

## What's in the box

- Next.js 14 App Router + TypeScript + Tailwind
- Multi-tenant, role-aware (Owner / Admin / Health Officer / Screener / Viewer)
- HMAC-signed sessions; per-IP rate limiting on auth, AI, lead, screening, report endpoints
- Provider-agnostic AI (OpenAI / Anthropic / deterministic fallback that reads live org data)
- Cached AI dashboard briefing with manual refresh — no AI call on every page load
- Configurable operational risk weights per org (audited)
- Lead capture with Slack webhook notification and persistent lead table
- Real CSV export, JSON org export (owner-only), audit log search & CSV export
- Public marketing site, in-app demo script (gated to internal owner/admin), ROI calculator with shared pricing function
- Supabase schema with RLS policies + seed data ready to wire up
- Unit tests for risk scoring and permissions
- CI on every push and PR (typecheck + tests + build)

---

## Quick start

```bash
git clone <this repo>
cd outbreakos
npm install
cp .env.example .env.local      # works out of the box for demo
SESSION_SECRET=dev-secret npm run dev
# http://localhost:3000
```

The product runs in demo mode with no API keys configured. All data is seeded
in-process; the Supabase schema is provided for production.

### Demo accounts (password `demo` for all five)

| Email                      | Role            | Use for                          |
| -------------------------- | --------------- | -------------------------------- |
| `demo@outbreakos.io`       | Owner           | Default tour                     |
| `admin@outbreakos.io`      | Admin           | Settings, resources              |
| `ho@outbreakos.io`         | Health Officer  | Alerts, contacts, reports        |
| `screener@outbreakos.io`   | Screener        | Screening workflow only          |
| `viewer@outbreakos.io`     | Viewer          | Investor / read-only walkthrough |

Sign in at `/login`. The login form has one-click chips for each role.

**New signups create their own org.** New tenants land on an onboarding
checklist, NOT the demo data. The seeded Bundibugyo scenario is only visible
to the five seeded demo accounts.

---

## Environment variables

See `.env.example`. Key vars:

| Variable                       | Required               | Purpose                                            |
| ------------------------------ | ---------------------- | -------------------------------------------------- |
| `SESSION_SECRET`               | **required in prod**   | HMAC signing key for session cookies               |
| `NEXT_PUBLIC_DEMO_MODE`        | default `true`         | Seeded scenario + demo accounts active             |
| `NEXT_PUBLIC_SUPABASE_URL`     | optional               | Supabase project URL                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| optional               | Supabase anon key                                  |
| `SUPABASE_SERVICE_ROLE_KEY`    | optional               | For migrations                                     |
| `AI_PROVIDER`                  | default `none`         | `openai` / `anthropic` / `none`                    |
| `OPENAI_API_KEY`               | conditional            | Required if `AI_PROVIDER=openai`                   |
| `ANTHROPIC_API_KEY`            | conditional            | Required if `AI_PROVIDER=anthropic`                |
| `LEADS_WEBHOOK_URL`            | recommended            | Slack webhook for new pilot leads                  |
| `MESSAGING_PROVIDER`           | default `none`         | `twilio` / `whatsapp` / `none`                     |
| `TWILIO_ACCOUNT_SID/TOKEN/FROM`| conditional            | Required if `MESSAGING_PROVIDER=twilio`            |

Server-only secrets never reach the browser; only `NEXT_PUBLIC_*` is exposed
client-side.

---

## Supabase deployment

1. Create a new Supabase project.
2. Run `supabase/schema.sql` in the SQL editor (tables, indexes, RLS).
3. Run `supabase/seed.sql` if you want the Bundibugyo demo scenario in DB.
4. Add Supabase env vars to `.env.local` or Vercel project.
5. Replace `lib/store.ts` implementations with Supabase client queries —
   the `data` accessor + mutation function signatures are stable.

RLS enforces tenant isolation at the row level via the `auth_org_id()` SQL
helper.

---

## Vercel deployment

```bash
vercel link
vercel env add SESSION_SECRET production       # REQUIRED — generate with: openssl rand -base64 48
vercel env add LEADS_WEBHOOK_URL production    # Slack webhook
vercel env add OPENAI_API_KEY production       # optional
vercel --prod
```

`vercel.json` pins build settings and security headers (HSTS, X-Frame-Options,
X-Content-Type-Options, Referrer-Policy, Permissions-Policy).

---

## Testing

```bash
npm test                # unit tests (risk scoring + permissions)
npm run typecheck       # tsc --noEmit
npm run build           # production build
```

CI runs all three on every push to `main` and every PR (`.github/workflows/ci.yml`).

---

## Architecture notes

- `app/(marketing)/*` — public-facing site (no auth)
- `app/dashboard/*` — authenticated command center (signed-cookie gated)
- `app/api/*` — REST endpoints (auth, screenings, alerts, contacts, resources,
  reports, AI, export, settings, sites, leads). Every mutation enforces a
  `Capability` via `requireCapability()`.
- `lib/store.ts` — multi-tenant in-process store. Every accessor and mutation
  takes an `orgId`. Production swap-in is Supabase; data shapes match the
  schema in `supabase/schema.sql`.
- `lib/permissions.ts` — central RBAC matrix.
- `lib/auth.ts` — HMAC-signed sessions; `requireSession()` / `requireCapability()`.
- `lib/ratelimit.ts` — per-IP token-bucket; swap for `@upstash/ratelimit` for
  multi-instance deploys.
- `lib/cache.ts` — TTL cache used by the dashboard AI briefing.
- `lib/risk.ts` — explainable, transparent risk-tier engine; configurable
  weights per org.
- `lib/ai.ts` — provider-agnostic; deterministic fallback reads live org data.
- `lib/pricing.ts` — single pricing function used by `/pricing` and `/roi`.

---

## Known limitations (be honest about these in sales conversations)

### Live in this build
- **Passwords are bcrypt-hashed** (cost factor 10). Demo accounts use the
  pre-computed hash of `"demo"`; new signups hash their own ≥8-char password.
- **Native PDF report generator** at `/api/reports/[id]/pdf` (react-pdf,
  branded header, footer, disclaimer block).
- **Rate limiter has Upstash Redis adapter** — set `UPSTASH_REDIS_REST_URL`
  and `UPSTASH_REDIS_REST_TOKEN` and it switches transparently; otherwise
  uses an in-process token bucket.
- **Lead capture persists** to in-memory store, Slack-notified, and visible
  at `/dashboard/leads` (owner-only).
- **Lead form captures UTM** (`utm_source`, `utm_medium`, `utm_campaign`,
  `utm_content`, `utm_term`, plus `document.referrer`).
- **Configurable per-org risk thresholds** alongside the weights, both audited.
- **Onboarding completion persists** per-tenant in `org_settings.onboarding`.
- **Toast notifications + skip-to-content + dashboard error boundary +
  loading skeleton** in place.
- **`/api/health`** returns backend status for uptime monitors.
- **AI chat renders structured markdown with inline citation chips**
  (highlighted when matched against the actual `citations` array).

### Honest gaps — work that was started but not finished in this batch
- **Supabase data layer swap is NOT live.** The schema (`supabase/schema.sql`,
  now includes `leads` and `user_credentials`), the seed, the migration
  runner (`npm run db:migrate`), and the server client factory
  (`lib/supabase/server.ts`) are all in place. The remaining work — making
  every `data.*` accessor and mutation function `async` and adding `await`
  at every call site (~25 files) — is documented step-by-step in
  `supabase/SWAP.md`. Estimated 6-8 hours with an integration environment.
  Until then, cold starts on Vercel reset the in-memory store.

### Still deferred to future batches
- **Email verification + password reset** — via Supabase Auth post-swap.
- **SSO / SAML / OIDC** — via Supabase + WorkOS for the first pilot.
- **SCIM provisioning** — roadmap.
- **SOC 2 Type II** — roadmap.
- **Realtime updates** (other tabs go stale after mutations) — needs Supabase
  channels post-swap.
- **Bulk SMS check-in send** — Twilio adapter wired in `MESSAGING_PROVIDER`
  abstraction but no send loop yet.
- **Twilio inbound webhook receiver** — `/api/webhooks/twilio` not built.
- **Map marker clustering** — `leaflet.markercluster` is installed but not
  wired into `app/dashboard/map/leaflet-map.tsx` yet.
- **Global `⌘K` command palette** — not implemented.
- **`i18n` (French + Portuguese)** — not implemented; required for DRC,
  francophone West Africa, Brazil, Mozambique.
- **Field-mode (tablet-friendly) screening UI** — not implemented.
- **Days-of-cover projection chart** on resources — not implemented.
- **Email + CRM forwarding for `/api/leads`** — Slack-only today.

---

## Next 30-day roadmap (updated)

**Week 1** — Complete the Supabase data-layer swap per `supabase/SWAP.md`.
Move the audit log and leads from in-memory to their Postgres tables.

**Week 2** — Email verification + password reset via Supabase Auth. SSO via
Supabase + WorkOS for the first pilot customer. DPA template + sub-processors
page.

**Week 3** — Realtime updates via Supabase channels. Map marker clustering
wired in (`leaflet.markercluster` package is already installed). Twilio bulk
SMS check-in send + `/api/webhooks/twilio` inbound receiver. Email and CRM
(HubSpot/Pipedrive) forwarding from `/api/leads`.

**Week 4** — `i18n` (English + French + Portuguese) via `next-intl`. Mobile
field-mode UI for tablet-based screening. Global `⌘K` command palette.
Days-of-cover projection chart on resources. Reach three signed mining
pilots.

---

## Sales kit

### One-liner
> Operational health-security infrastructure for high-risk workforces —
> screening, contact monitoring, resource logistics, AI briefings — without
> ever pretending to be a diagnostic tool.

### Mining / industrial pitch (primary)
> Mining operators have a CFO who knows what one day of unplanned shutdown
> costs. OutbreakOS protects that day. Site-entry screening, daily check-ins
> for returning rotations, PPE logistics, branded board-grade SITREPs.
> Operational, explainable, auditable.

### Enterprise outreach email (template)
> Subject: Health-security operations platform for [Company] sites
>
> Dear {{name}},
>
> Mining and industrial operators with cross-border workforce movement face
> the most expensive form of risk: unplanned shutdown. OutbreakOS gives your
> HSE and operations leads site-entry screening with explainable risk tiers,
> 21-day contact monitoring, PPE / sample-kit logistics with days-of-cover
> alerts, and AI-assisted board briefings — none of which claim to diagnose
> disease.
>
> We have an Emergency Deployment Package that stands up a fully configured
> tenant within 72 hours, with branded SITREPs and screener training.
>
> Could I book 20 minutes to walk your team through a live demo?
>
> {{your_name}}

### Grant / contract positioning
OutbreakOS is positioned as **operational infrastructure**. It complements
(never replaces) WHO / CDC / ministry clinical guidance. Appropriate for grant
funding under: cross-border health-security coordination, point-of-entry
screening capacity strengthening, contact monitoring capability building,
workforce protection in extractive industries, donor reporting and
accountability.

---

## Safety & compliance

OutbreakOS:

- is **not** a medical device
- does **not** diagnose disease or determine infection status
- does **not** replace clinical judgment
- requires **human review** for every AI output
- maintains an immutable **audit log** of operational actions
- enforces **multi-tenant isolation** at the data and capability layers
- exposes no fake integrations — only providers that are actually configured

See `/compliance` and `/security` for full live-vs-roadmap statements.
