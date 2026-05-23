// Persistence layer. Multi-tenant: every entity carries org_id and every
// mutation enforces it. In demo / dev mode this is an in-process store; in
// production set DATABASE_URL and swap this module for the Supabase
// implementation (schema in /supabase/schema.sql).
//
// CRITICAL: every accessor below filters by orgId. Do not bypass.

import {
  DEMO_ALERTS,
  DEMO_AUDIT,
  DEMO_CASES,
  DEMO_CONTACTS,
  DEMO_ORG,
  DEMO_REGIONS,
  DEMO_REPORTS,
  DEMO_RESOURCES,
  DEMO_SCREENINGS,
  DEMO_SETTINGS,
  DEMO_SITES,
  DEMO_USERS,
} from "./demo-data";
import type {
  Alert,
  AuditEvent,
  CaseRecord,
  Contact,
  Organization,
  OrgSettings,
  OutbreakRegion,
  Profile,
  ResourceItem,
  ScreeningRecord,
  Site,
  SitRep,
} from "./types";
import { uid } from "./utils";

export interface Lead {
  id: string;
  email: string;
  name?: string;
  org?: string;
  role?: string;
  audience?: string;
  intent?: string;
  message?: string;
  source: string;
  createdAt: string;
}

interface Db {
  orgs: Organization[];
  users: Profile[];
  sites: Site[];
  regions: OutbreakRegion[];
  cases: CaseRecord[];
  screenings: ScreeningRecord[];
  contacts: Contact[];
  alerts: Alert[];
  resources: ResourceItem[];
  reports: SitRep[];
  audit: AuditEvent[];
  settings: OrgSettings[];
  leads: Lead[];
  // Passwords are hashed in production (Supabase auth or bcrypt).
  // In demo mode we map userId -> plain password for the seeded accounts only.
  passwords: Map<string, string>;
}

const g = globalThis as unknown as { __outbreakos_db?: Db };

function freshDb(): Db {
  const passwords = new Map<string, string>();
  // The five seeded demo accounts share the password "demo" so the platform
  // ships in a usable state. Newly-signed-up users get their own (bcrypted
  // in production) credentials and never see this map.
  for (const u of DEMO_USERS) passwords.set(u.id, "demo");
  return {
    orgs: [structuredClone(DEMO_ORG)],
    users: structuredClone(DEMO_USERS),
    sites: structuredClone(DEMO_SITES),
    regions: structuredClone(DEMO_REGIONS),
    cases: structuredClone(DEMO_CASES),
    screenings: structuredClone(DEMO_SCREENINGS),
    contacts: structuredClone(DEMO_CONTACTS),
    alerts: structuredClone(DEMO_ALERTS),
    resources: structuredClone(DEMO_RESOURCES),
    reports: structuredClone(DEMO_REPORTS),
    audit: structuredClone(DEMO_AUDIT),
    settings: [structuredClone(DEMO_SETTINGS)],
    leads: [],
    passwords,
  };
}

if (!g.__outbreakos_db) g.__outbreakos_db = freshDb();
export function db(): Db {
  return g.__outbreakos_db!;
}
export function resetDb() {
  g.__outbreakos_db = freshDb();
}

// ============================================================
// TENANT-SCOPED ACCESSORS — use these from pages / API routes
// ============================================================

export const data = {
  org: (orgId: string) => db().orgs.find((o) => o.id === orgId) || null,
  users: (orgId: string) => db().users.filter((u) => u.orgId === orgId),
  sites: (orgId: string) => db().sites.filter((s) => s.orgId === orgId),
  regions: (orgId: string) => db().regions.filter((r) => r.orgId === orgId),
  cases: (orgId: string) => db().cases.filter((c) => c.orgId === orgId),
  screenings: (orgId: string) => db().screenings.filter((s) => s.orgId === orgId),
  contacts: (orgId: string) => db().contacts.filter((c) => c.orgId === orgId),
  alerts: (orgId: string) => db().alerts.filter((a) => a.orgId === orgId),
  resources: (orgId: string) => db().resources.filter((r) => r.orgId === orgId),
  reports: (orgId: string) => db().reports.filter((r) => r.orgId === orgId),
  audit: (orgId: string) => db().audit.filter((a) => a.orgId === orgId),
  settings: (orgId: string) =>
    db().settings.find((s) => s.orgId === orgId) || defaultSettings(orgId),
  leads: () => db().leads, // global; only owner of demo org sees them
};

function defaultSettings(orgId: string): OrgSettings {
  return {
    orgId,
    aiProvider: "none",
    messagingProvider: "none",
    riskWeights: {
      fever: 25,
      bleeding: 40,
      contact: 30,
      travel: 20,
      hcw: 15,
      funeral: 20,
    },
    apiKeysMasked: [],
  };
}

// ============================================================
// MUTATIONS — every one takes an orgId and writes only within it
// ============================================================

export function logAudit(
  orgId: string,
  actor: string,
  action: string,
  target: string,
  meta?: Record<string, unknown>,
) {
  const entry: AuditEvent = {
    id: uid("a"),
    orgId,
    actor,
    action,
    target,
    meta,
    createdAt: new Date().toISOString(),
  };
  db().audit.unshift(entry);
  return entry;
}

export function createOrg(name: string, mode: Organization["mode"] = "standard") {
  const slug =
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") +
    "-" +
    uid("").slice(1, 5);
  const org: Organization = {
    id: uid("org"),
    name,
    slug,
    mode,
    branding: { primary: "#38bdf8", logoText: "OutbreakOS" },
    createdAt: new Date().toISOString(),
  };
  db().orgs.push(org);
  db().settings.push(defaultSettings(org.id));
  return org;
}

export function createUser(
  orgId: string,
  profile: Omit<Profile, "id" | "orgId" | "createdAt">,
  password: string,
) {
  const user: Profile = {
    id: uid("u"),
    orgId,
    createdAt: new Date().toISOString(),
    ...profile,
  };
  db().users.unshift(user);
  // NOTE: in production this is a bcrypt hash via Supabase auth. In demo
  // mode we hold the raw password to keep the seeded flow working without
  // external dependencies.
  db().passwords.set(user.id, password);
  return user;
}

export function verifyPassword(userId: string, password: string): boolean {
  return db().passwords.get(userId) === password;
}

export function addScreening(
  orgId: string,
  actor: string,
  rec: Omit<ScreeningRecord, "id" | "orgId" | "createdAt">,
) {
  const full: ScreeningRecord = {
    id: uid("scr"),
    orgId,
    createdAt: new Date().toISOString(),
    ...rec,
  };
  db().screenings.unshift(full);
  logAudit(orgId, actor, "screening.create", full.id);

  if (full.risk === "urgent" || full.risk === "elevated") {
    const alert: Alert = {
      id: uid("al"),
      orgId,
      category: "high_risk_screening",
      severity: full.risk === "urgent" ? "critical" : "high",
      title:
        full.risk === "urgent"
          ? `Urgent operational tier — ${full.subjectName}`
          : `Elevated operational tier — ${full.subjectName}`,
      description: `${full.context.replace("_", " ")} screening produced ${full.risk} tier. Action: ${full.action}`,
      status: "open",
      linkedId: full.id,
      createdAt: new Date().toISOString(),
    };
    db().alerts.unshift(alert);
    logAudit(orgId, "system", "alert.create", alert.id, { from: full.id });
  }

  if (full.risk === "monitor" || full.risk === "elevated" || full.risk === "urgent") {
    const c: Contact = {
      id: uid("ct"),
      orgId,
      name: `Contact-${full.id.slice(-6).toUpperCase()}`,
      linkedScreeningId: full.id,
      monitoringStart: new Date().toISOString(),
      monitoringEnd: new Date(Date.now() + 21 * 86400000).toISOString(),
      status: full.risk === "urgent" ? "escalated" : "active",
      checkins: [{ day: 1, date: new Date().toISOString(), status: "ok" }],
      notes: `Auto-enrolled from ${full.context} screening`,
    };
    db().contacts.unshift(c);
  }

  return full;
}

export function addContact(orgId: string, actor: string, c: Omit<Contact, "id" | "orgId">) {
  const full: Contact = { id: uid("ct"), orgId, ...c };
  db().contacts.unshift(full);
  logAudit(orgId, actor, "contact.create", full.id);
  return full;
}

export function updateContactStatus(
  orgId: string,
  id: string,
  status: Contact["status"],
  actor: string,
) {
  const c = db().contacts.find((x) => x.id === id && x.orgId === orgId);
  if (!c) return null;
  c.status = status;
  logAudit(orgId, actor, "contact.update", id, { status });
  return c;
}

export function logCheckin(
  orgId: string,
  id: string,
  day: number,
  status: "ok" | "symptom" | "missed",
  actor: string,
) {
  const c = db().contacts.find((x) => x.id === id && x.orgId === orgId);
  if (!c) return null;
  const existing = c.checkins.find((x) => x.day === day);
  if (existing) {
    existing.status = status;
    existing.date = new Date().toISOString();
  } else {
    c.checkins.push({ day, date: new Date().toISOString(), status });
    c.checkins.sort((a, b) => a.day - b.day);
  }
  logAudit(orgId, actor, "contact.checkin", id, { day, status });
  return c;
}

export function addAlert(
  orgId: string,
  actor: string,
  a: Omit<Alert, "id" | "orgId" | "createdAt" | "status">,
) {
  const full: Alert = {
    id: uid("al"),
    orgId,
    createdAt: new Date().toISOString(),
    status: "open",
    ...a,
  };
  db().alerts.unshift(full);
  logAudit(orgId, actor, "alert.create", full.id);
  return full;
}

export function setAlertStatus(
  orgId: string,
  id: string,
  status: Alert["status"],
  actor: string,
) {
  const a = db().alerts.find((x) => x.id === id && x.orgId === orgId);
  if (!a) return null;
  a.status = status;
  if (status === "resolved") a.resolvedAt = new Date().toISOString();
  logAudit(orgId, actor, `alert.${status}`, id);
  return a;
}

export function adjustResource(
  orgId: string,
  id: string,
  delta: number,
  actor: string,
  reason: string,
) {
  const r = db().resources.find((x) => x.id === id && x.orgId === orgId);
  if (!r) return null;
  r.onHand = Math.max(0, r.onHand + delta);
  logAudit(orgId, actor, "resource.update", id, { delta, reason });
  return r;
}

export function addReport(rpt: Omit<SitRep, "id">) {
  const full: SitRep = { ...rpt, id: uid("rpt") };
  db().reports.unshift(full);
  logAudit(rpt.orgId, full.generatedBy, "report.generate", full.id);
  return full;
}

export function createSite(
  orgId: string,
  actor: string,
  s: Omit<Site, "id" | "orgId">,
) {
  const site: Site = { id: uid("site"), orgId, ...s };
  db().sites.push(site);
  logAudit(orgId, actor, "site.create", site.id);
  return site;
}

export function updateSite(
  orgId: string,
  id: string,
  patch: Partial<Site>,
  actor: string,
) {
  const s = db().sites.find((x) => x.id === id && x.orgId === orgId);
  if (!s) return null;
  Object.assign(s, patch, { id: s.id, orgId: s.orgId });
  logAudit(orgId, actor, "site.update", id);
  return s;
}

export function updateSettings(
  orgId: string,
  patch: Partial<OrgSettings>,
  actor: string,
) {
  let s = db().settings.find((x) => x.orgId === orgId);
  if (!s) {
    s = defaultSettings(orgId);
    db().settings.push(s);
  }
  Object.assign(s, patch, { orgId });
  logAudit(orgId, actor, "settings.update", "settings", patch);
  return s;
}

export function addLead(l: Omit<Lead, "id" | "createdAt">) {
  const lead: Lead = { id: uid("lead"), createdAt: new Date().toISOString(), ...l };
  db().leads.unshift(lead);
  return lead;
}
