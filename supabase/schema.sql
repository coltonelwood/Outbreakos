-- OutbreakOS — production database schema.
-- Designed for multi-tenant isolation via Postgres Row Level Security.
-- All tenant-owned tables carry org_id (uuid) and have an RLS policy that
-- restricts visibility to the org_id encoded on the JWT.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  mode text not null default 'standard'
    check (mode in ('standard','mining_site','airport_poe','gov_emergency','ngo_field')),
  branding jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Profiles (linked to auth.users via id)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key,
  org_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null
    check (role in ('owner','admin','health_officer','screener','viewer')),
  site_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists profiles_org_id_idx on profiles(org_id);

-- ---------------------------------------------------------------------------
-- Sites
-- ---------------------------------------------------------------------------
create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  kind text not null
    check (kind in ('airport','mine','hospital','clinic','border','field_base')),
  country text not null,
  region text not null,
  lat double precision not null,
  lng double precision not null,
  workers_per_day int,
  status text not null default 'active'
    check (status in ('active','monitoring','lockdown')),
  created_at timestamptz not null default now()
);
create index if not exists sites_org_id_idx on sites(org_id);

-- ---------------------------------------------------------------------------
-- Outbreak regions (operational tracking — not a clinical registry)
-- ---------------------------------------------------------------------------
create table if not exists outbreak_regions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  country text not null,
  lat double precision not null,
  lng double precision not null,
  radius_km int not null default 50,
  confirmed int not null default 0,
  suspected int not null default 0,
  deaths int not null default 0,
  contacts_monitored int not null default 0,
  severity text not null default 'info'
    check (severity in ('info','warning','high','critical')),
  trend text not null default 'stable'
    check (trend in ('rising','stable','declining')),
  updated_at timestamptz not null default now()
);
create index if not exists regions_org_id_idx on outbreak_regions(org_id);

-- ---------------------------------------------------------------------------
-- Cases (operational classification only; not a diagnosis)
-- ---------------------------------------------------------------------------
create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  region_id uuid references outbreak_regions(id) on delete set null,
  classification text not null check (classification in ('suspected','probable','confirmed')),
  outcome text not null default 'monitoring' check (outcome in ('monitoring','recovered','deceased')),
  reported_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists cases_org_id_idx on cases(org_id);
create index if not exists cases_region_id_idx on cases(region_id);

-- ---------------------------------------------------------------------------
-- Screenings
-- ---------------------------------------------------------------------------
create table if not exists screenings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  context text not null check (context in ('airport','site_entry','clinic')),
  subject_name text not null,
  anonymous boolean not null default true,
  age_range text not null check (age_range in ('0-17','18-39','40-59','60+')),
  origin_country text,
  origin_region text,
  destination text,
  travel_history jsonb not null default '[]'::jsonb,
  contact_with_case boolean not null default false,
  symptoms jsonb not null default '{}'::jsonb,
  hcw_exposure boolean not null default false,
  funeral_exposure boolean not null default false,
  notes text,
  risk text not null check (risk in ('low','monitor','elevated','urgent')),
  action text not null,
  rationale jsonb not null default '[]'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists screenings_org_id_idx on screenings(org_id);
create index if not exists screenings_site_id_idx on screenings(site_id);
create index if not exists screenings_created_at_idx on screenings(created_at desc);

-- ---------------------------------------------------------------------------
-- Contacts (21-day monitoring subjects)
-- ---------------------------------------------------------------------------
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  phone text,
  linked_screening_id uuid references screenings(id) on delete set null,
  linked_case_id uuid references cases(id) on delete set null,
  monitoring_start timestamptz not null default now(),
  monitoring_end timestamptz not null,
  status text not null default 'active'
    check (status in ('active','cleared','escalated','lost_to_follow_up')),
  checkins jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists contacts_org_id_idx on contacts(org_id);

-- ---------------------------------------------------------------------------
-- Alerts
-- ---------------------------------------------------------------------------
create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  category text not null
    check (category in (
      'high_risk_screening','missed_checkin','cluster_increase',
      'ppe_low_stock','border_risk','lab_pending','manual'
    )),
  severity text not null check (severity in ('info','warning','high','critical')),
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open','ack','resolved')),
  owner uuid references profiles(id) on delete set null,
  linked_id text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists alerts_org_id_idx on alerts(org_id);
create index if not exists alerts_status_idx on alerts(status);

-- ---------------------------------------------------------------------------
-- Resources (PPE, sample kits, beds, staff, vehicles)
-- ---------------------------------------------------------------------------
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  category text not null
    check (category in (
      'ppe_kit','gloves','gowns','masks','sample_kits','disinfectant','beds','staff','vehicles'
    )),
  label text not null,
  on_hand int not null default 0,
  min_stock int not null default 0,
  burn_rate_per_day int not null default 0,
  unit text not null default 'units',
  updated_at timestamptz not null default now()
);
create index if not exists resources_org_id_idx on resources(org_id);
create index if not exists resources_site_id_idx on resources(site_id);

-- ---------------------------------------------------------------------------
-- Reports / SITREPs
-- ---------------------------------------------------------------------------
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  kind text not null
    check (kind in ('daily_sitrep','exec_briefing','airport_screening','mining_workforce','ngo_donor')),
  title text not null,
  generated_at timestamptz not null default now(),
  generated_by uuid references profiles(id) on delete set null,
  ai_assisted boolean not null default false,
  summary text not null,
  key_numbers jsonb not null default '[]'::jsonb,
  hotspots jsonb not null default '[]'::jsonb,
  open_risks jsonb not null default '[]'::jsonb,
  recommended jsonb not null default '[]'::jsonb,
  changes_since_last jsonb not null default '[]'::jsonb
);
create index if not exists reports_org_id_idx on reports(org_id);

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  actor text not null,
  action text not null,
  target text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_org_id_idx on audit_logs(org_id);
create index if not exists audit_created_at_idx on audit_logs(created_at desc);

-- ---------------------------------------------------------------------------
-- Org settings (1:1)
-- ---------------------------------------------------------------------------
create table if not exists org_settings (
  org_id uuid primary key references organizations(id) on delete cascade,
  ai_provider text not null default 'none' check (ai_provider in ('openai','anthropic','none')),
  messaging_provider text not null default 'none' check (messaging_provider in ('twilio','whatsapp','none')),
  risk_weights jsonb not null default '{}'::jsonb,
  api_keys_masked jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table sites enable row level security;
alter table outbreak_regions enable row level security;
alter table cases enable row level security;
alter table screenings enable row level security;
alter table contacts enable row level security;
alter table alerts enable row level security;
alter table resources enable row level security;
alter table reports enable row level security;
alter table audit_logs enable row level security;
alter table org_settings enable row level security;

-- Helper: get org_id of the authenticated user.
create or replace function auth_org_id() returns uuid
language sql stable
as $$
  select org_id from profiles where id = auth.uid()
$$;

-- Per-table policies: a user can only see / mutate rows in their own org.
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'profiles','sites','outbreak_regions','cases','screenings',
    'contacts','alerts','resources','reports','audit_logs','org_settings'
  ]) loop
    execute format('drop policy if exists tenant_select on %I', t);
    execute format(
      'create policy tenant_select on %I for select to authenticated using (org_id = auth_org_id())',
      t
    );
    execute format('drop policy if exists tenant_modify on %I', t);
    execute format(
      'create policy tenant_modify on %I for all to authenticated using (org_id = auth_org_id()) with check (org_id = auth_org_id())',
      t
    );
  end loop;
end $$;

-- The organizations table itself: a user sees only their own org row.
drop policy if exists tenant_org_select on organizations;
create policy tenant_org_select on organizations for select to authenticated
  using (id = auth_org_id());
