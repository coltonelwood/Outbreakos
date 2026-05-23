-- OutbreakOS — seed data for the demo Bundibugyo / Ituri scenario.
-- This is illustrative operational data, NOT real incident data.

begin;

-- Demo organization
insert into organizations (id, name, slug, mode, branding)
values (
  '00000000-0000-0000-0000-000000000001',
  'Sentinel Response Coalition',
  'sentinel-response',
  'gov_emergency',
  '{"primary":"#38bdf8","logoText":"OutbreakOS"}'::jsonb
)
on conflict (id) do nothing;

-- Sites
insert into sites (org_id, name, kind, country, region, lat, lng, workers_per_day, status)
values
  ('00000000-0000-0000-0000-000000000001','Entebbe International Airport','airport','Uganda','Wakiso',0.0424,32.4435,4200,'active'),
  ('00000000-0000-0000-0000-000000000001','Bunia Airport Checkpoint','airport','DRC','Ituri',1.5658,30.221,800,'monitoring'),
  ('00000000-0000-0000-0000-000000000001','Bundibugyo District Hospital','hospital','Uganda','Bundibugyo',0.7117,30.0639,null,'monitoring'),
  ('00000000-0000-0000-0000-000000000001','Mpondwe / Kasese Border Post','border','Uganda','Kasese',0.2156,29.9586,2300,'active'),
  ('00000000-0000-0000-0000-000000000001','Kilo-Moto Gold Operation','mine','DRC','Ituri',1.85,30.18,1800,'monitoring'),
  ('00000000-0000-0000-0000-000000000001','NGO Field Coordination Base','field_base','DRC','North Kivu',-1.65,29.22,null,'active');

-- Regions
insert into outbreak_regions (org_id, name, country, lat, lng, radius_km, confirmed, suspected, deaths, contacts_monitored, severity, trend)
values
  ('00000000-0000-0000-0000-000000000001','Bundibugyo District','Uganda',0.7117,30.0639,45,14,23,3,187,'high','rising'),
  ('00000000-0000-0000-0000-000000000001','Kasese District','Uganda',0.1833,30.0833,60,4,9,0,62,'warning','stable'),
  ('00000000-0000-0000-0000-000000000001','Ituri Province','DRC',1.5,29.5,120,6,18,1,94,'high','rising'),
  ('00000000-0000-0000-0000-000000000001','North Kivu','DRC',-0.7,29.2,140,2,7,0,31,'warning','stable');

-- Org settings
insert into org_settings (org_id, ai_provider, messaging_provider, risk_weights, api_keys_masked)
values (
  '00000000-0000-0000-0000-000000000001',
  'none',
  'none',
  '{"fever":25,"bleeding":40,"contact":30,"travel":20,"hcw":15,"funeral":20}'::jsonb,
  '[{"name":"Reporting Webhook","lastFour":"9f2c"},{"name":"Lab Integration","lastFour":"11ab"}]'::jsonb
)
on conflict (org_id) do nothing;

commit;
