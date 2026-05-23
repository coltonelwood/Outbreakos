# OutbreakOS

**AI-powered outbreak operations command center** — real-time screening,
contact monitoring, resource coordination, AI briefings, and executive
reporting for airports, mining sites, hospitals, NGOs, and government
response teams.

> OutbreakOS is **not** a medical diagnostic device. It supports operational
> screening, contact monitoring, logistics, and reporting workflows.
> Clinical decisions are made by qualified health authorities.

---

## What's in the box

- Next.js 14 App Router + TypeScript + Tailwind + shadcn-style components
- Public marketing site (Home, Solutions, Airports, Mining, Hospitals,
  Government & NGO, Pricing, Security, Compliance, Contact, ROI)
- Authenticated command-center dashboard:
  - Operations Overview (live stats, AI summary, chart, alerts)
  - Outbreak Map (Leaflet, severity filters, sites + regions)
  - Screening workflow (airport / site-entry / clinic, risk tiering, printable record)
  - Contact monitoring (21-day timeline, SMS / WhatsApp templates, escalation)
  - Alerts center (categories, severity, status, manual creation)
  - Resource logistics (PPE / sample kits / beds / staff / vehicles + AI forecast)
  - Situation reports (5 kinds, AI-assisted, printable PDF view)
  - AI Command Center (briefings, summaries, stakeholder drafts, with citations)
  - Multi-site command (corridors, cluster detection, sites at a glance)
  - Sites, Settings (providers, RBAC, risk weights, branding, data export)
  - Audit log
  - In-app Demo Script (sales-ready walk-through)
- Supabase SQL schema with RLS policies + seed data
- Provider-agnostic AI abstraction (OpenAI, Anthropic, or deterministic fallback)
- Twilio / WhatsApp messaging abstraction (templates work offline)
- Stripe-ready pricing architecture
- Vercel-ready deployment

---

## Quick start

```bash
git clone <this repo>
cd outbreakos
npm install
cp .env.example .env.local      # works out of the box
npm run dev                     # http://localhost:3000
```

The product runs **fully in demo mode with no API keys configured**. All data
is seeded in memory; the Supabase schema is provided for when you're ready to
swap in a real backend.

### Demo accounts (password: `demo` for all)

| Email | Role | Use for |
| --- | --- | --- |
| `demo@outbreakos.io` | Owner | Default tour |
| `admin@outbreakos.io` | Admin | Settings, resources |
| `ho@outbreakos.io` | Health Officer | Alerts, contacts, reports |
| `screener@outbreakos.io` | Screener | Screening workflow |
| `viewer@outbreakos.io` | Viewer | Investor / read-only walkthrough |

Sign in at `/login`, or click the quick-account chips on the login form.

The seeded scenario is `drc-uganda-bundibugyo-2026` — a cross-border response
across Bundibugyo (Uganda), Kasese, Ituri (DRC), and North Kivu. Every record
is labeled **demo data** in the UI.

---

## Environment variables

See `.env.example`. The platform reads:

| Variable | Purpose | Required? |
| --- | --- | --- |
| `NEXT_PUBLIC_DEMO_MODE` | Run with in-memory store + seed data | default `true` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | optional |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) | optional |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role for migrations | optional |
| `AI_PROVIDER` | `openai` / `anthropic` / `none` | default `none` |
| `OPENAI_API_KEY` | OpenAI key (server-only) | optional |
| `ANTHROPIC_API_KEY` | Anthropic key (server-only) | optional |
| `MESSAGING_PROVIDER` | `twilio` / `whatsapp` / `none` | default `none` |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Twilio | optional |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe checkout | optional |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox (Leaflet+OSM works without it) | optional |

Secrets never reach the browser; only `NEXT_PUBLIC_*` values are exposed
client-side.

---

## Supabase deployment

1. Create a new Supabase project.
2. Run `supabase/schema.sql` in the SQL editor (creates tables, indexes, RLS).
3. Run `supabase/seed.sql` to seed the demo scenario into a real database.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to
   `.env.local` (or your Vercel project).
5. Swap the in-memory store calls in `lib/store.ts` for Supabase client calls
   — the data shapes match exactly.

RLS policies enforce **multi-tenant isolation at the row level** via the
`auth_org_id()` SQL helper.

---

## Vercel deployment

```bash
vercel link
vercel env add OPENAI_API_KEY                  # (optional)
vercel env add NEXT_PUBLIC_SUPABASE_URL        # (optional)
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY   # (optional)
vercel --prod
```

The app is fully static-friendly for marketing pages and uses Next.js server
components for dashboard data.

---

## Test checklist

- [ ] `/` loads marketing home with hero, modules, audiences, CTA.
- [ ] Each of `/airports`, `/mining`, `/hospitals`, `/government`, `/solutions`,
      `/pricing`, `/security`, `/compliance`, `/contact`, `/roi` renders.
- [ ] `/contact` form submits successfully (logged to audit).
- [ ] `/roi` calculator updates totals live and downloads proposal text.
- [ ] `/login` allows sign-in with each demo account.
- [ ] `/signup` creates an account and lands on the dashboard.
- [ ] `/dashboard` shows stats, AI summary, chart, regions, alerts.
- [ ] `/dashboard/map` renders the Leaflet map with markers + circles.
- [ ] `/dashboard/screenings/new` scores a screening end-to-end and shows
      the operational risk tier with explainable rationale.
- [ ] Screening result is printable (`window.print()`) and saved to the store.
- [ ] `/dashboard/contacts` shows 21-day timeline, allows status updates and
      template message preview.
- [ ] `/dashboard/alerts` filters work, manual alert creation works,
      acknowledge / resolve / reopen work.
- [ ] `/dashboard/resources` allows inventory adjustment and AI forecast.
- [ ] `/dashboard/reports` generates each of the 5 report kinds; report
      detail is printable.
- [ ] `/dashboard/ai` answers freeform questions and shortcut intents.
- [ ] `/dashboard/command` shows risk corridors, cluster detection, sites.
- [ ] `/dashboard/sites` lists all sites with status badges.
- [ ] `/dashboard/settings` shows org, users, providers, risk weights, and
      can export org data as JSON.
- [ ] `/dashboard/audit` displays the audit log.
- [ ] `/dashboard/demo-script` opens — and every step deep-links correctly.

---

## Sales kit

### One-liner

> OutbreakOS is the operations command center for outbreak response — airport
> screening, contact monitoring, resource logistics, AI briefings — without
> ever pretending to be a diagnostic tool.

### Enterprise outreach email (template)

> Subject: Operational outbreak command center — 72-hour deployment
>
> Dear {{name}},
>
> We work with airport authorities, mining operators, hospitals, and ministries
> who need a single operational picture during outbreak response. OutbreakOS
> gives your teams: traveler / worker screening with explainable risk tiers,
> 21-day contact monitoring, PPE and resource logistics, AI-assisted SITREPs,
> and a boardroom-grade multi-site command view.
>
> We have an Emergency Deployment Package that stands up a fully configured
> tenant within 72 hours, with branded SITREPs and screener training.
>
> Could I book 20 minutes to walk your team through a live demo?
>
> {{your_name}}

### Grant / contract positioning

OutbreakOS is positioned as **operational infrastructure** for outbreak
response. It complements (and never replaces) WHO / CDC / ministry clinical
guidance. It is appropriate for grant funding under:

- Cross-border health-security coordination
- Point-of-entry screening capacity strengthening
- Contact monitoring capability building
- Workforce protection in extractive industries
- Donor reporting and accountability

---

## Architecture notes

- `app/(marketing)/*` — public-facing site (no auth)
- `app/dashboard/*` — authenticated command center (cookie-gated)
- `app/api/*` — REST endpoints (auth, screenings, alerts, contacts, resources,
  reports, AI, export, leads)
- `lib/store.ts` — in-memory server store. Swap for Supabase in production.
- `lib/risk.ts` — transparent, explainable rule-based risk scoring
- `lib/ai.ts` — provider-agnostic AI with deterministic fallback
- `supabase/schema.sql` — production schema with RLS
- `middleware.ts` — protects `/dashboard/*` routes

## Safety & compliance

OutbreakOS:

- is **not** a medical device,
- does **not** diagnose disease,
- does **not** replace clinical judgment,
- requires **human review** for every AI output,
- maintains an immutable **audit log** of operational actions,
- enforces **multi-tenant isolation** at the database row level.

See `/compliance` and `/security` in the running app for full statements.
