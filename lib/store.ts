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
} from "./demo-data.ts";
import bcrypt from "bcryptjs";
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
import { uid } from "./utils.ts";

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
  utm?: Record<string, string>;
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
  // Session revocation: each issued session carries the user's current
  // sessionVersion. Bumping the version (logout-all, password change, user
  // deactivation) invalidates every previously-issued cookie for that user.
  // Maps to a `session_version` column on profiles in Postgres.
  sessionVersions: Map<string, number>;
  // Deactivated users cannot authenticate even with a valid session.
  deactivated: Set<string>;
  // Invite set-password tokens -> userId. (Postgres: a one-time-token table.)
  setPasswordTokens: Map<string, string>;
}

const g = globalThis as unknown as { __outbreakos_db?: Db };

// Pre-computed bcrypt hash of the seeded password "demo" so the demo accounts
// work without paying the bcrypt cost on every cold start. Generated once with
// bcrypt.hashSync("demo", 10).
const DEMO_PASSWORD_HASH = "$2b$10$ED/EieG.N/CxSMaULD5Lk.Svcg1Xo3gi7U60ICo11ri5uoe88Zor6";

function freshDb(): Db {
  const passwords = new Map<string, string>();
  // The five seeded demo accounts share the bcrypt hash of "demo" so the
  // platform ships in a usable state. Newly-signed-up users get their own
  // bcrypt hash and never see this seed.
  for (const u of DEMO_USERS) passwords.set(u.id, DEMO_PASSWORD_HASH);
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
    sessionVersions: new Map(DEMO_USERS.map((u) => [u.id, 1])),
    deactivated: new Set<string>(),
    setPasswordTokens: new Map<string, string>(),
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
    riskThresholds: { monitor: 15, elevated: 40, urgent: 70 },
    apiKeysMasked: [],
    onboarding: { dismissed: false, completedSteps: [] },
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
  // bcrypt cost factor 10 ≈ ~80ms on a modern CPU; tolerable at signup time.
  const hash = bcrypt.hashSync(password, 10);
  db().passwords.set(user.id, hash);
  db().sessionVersions.set(user.id, 1);
  return user;
}

export function verifyPassword(userId: string, password: string): boolean {
  if (db().deactivated.has(userId)) return false;
  const hash = db().passwords.get(userId);
  if (!hash) return false;
  // bcrypt.compareSync is constant-time and resistant to timing attacks.
  return bcrypt.compareSync(password, hash);
}

// ---- Session revocation -------------------------------------------------

export function currentSessionVersion(userId: string): number {
  return db().sessionVersions.get(userId) ?? 1;
}

// Bumping the version invalidates every cookie previously issued to the user.
export function revokeUserSessions(userId: string, actor: string, orgId: string) {
  const v = currentSessionVersion(userId) + 1;
  db().sessionVersions.set(userId, v);
  logAudit(orgId, actor, "session.revoke_all", userId, { newVersion: v });
  return v;
}

export function isDeactivated(userId: string): boolean {
  return db().deactivated.has(userId);
}

export function setPassword(userId: string, password: string, actor: string, orgId: string) {
  db().passwords.set(userId, bcrypt.hashSync(password, 10));
  // Changing the password forces re-login everywhere.
  revokeUserSessions(userId, actor, orgId);
  logAudit(orgId, actor, "user.password_set", userId);
}

// ---- User lifecycle -----------------------------------------------------

export function inviteUser(
  orgId: string,
  actor: string,
  email: string,
  name: string,
  role: Profile["role"],
) {
  // Invited users get a random temporary password and a set-password token.
  // (Email delivery is a separate concern; the token is surfaced to the
  //  inviting admin until an email provider is wired — see /api/users.)
  const tempPassword = uid("tmp") + uid("");
  const user = createUser(orgId, { email, name, role }, tempPassword);
  const token = Buffer.from(`${user.id}:${uid("set")}`).toString("base64url");
  db().setPasswordTokens.set(token, user.id);
  logAudit(orgId, actor, "user.invite", user.id, { email, role });
  return { user, token };
}

export function consumeSetPasswordToken(token: string, password: string) {
  const map = db().setPasswordTokens;
  const userId = map.get(token);
  if (!userId) return null;
  const user = db().users.find((u) => u.id === userId);
  if (!user) return null;
  db().passwords.set(userId, bcrypt.hashSync(password, 10));
  db().deactivated.delete(userId);
  map.delete(token);
  logAudit(user.orgId, userId, "user.password_set", userId, { via: "invite" });
  return user;
}

export function changeUserRole(
  orgId: string,
  userId: string,
  role: Profile["role"],
  actor: string,
) {
  const u = db().users.find((x) => x.id === userId && x.orgId === orgId);
  if (!u) return null;
  u.role = role;
  // Role change should re-issue the session so the new role takes effect.
  revokeUserSessions(userId, actor, orgId);
  logAudit(orgId, actor, "user.role_change", userId, { role });
  return u;
}

export function setUserActive(
  orgId: string,
  userId: string,
  active: boolean,
  actor: string,
) {
  const u = db().users.find((x) => x.id === userId && x.orgId === orgId);
  if (!u) return null;
  if (active) db().deactivated.delete(userId);
  else {
    db().deactivated.add(userId);
    revokeUserSessions(userId, actor, orgId);
  }
  logAudit(orgId, actor, active ? "user.reactivate" : "user.deactivate", userId);
  return u;
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

type SettingsPatch = {
  aiProvider?: OrgSettings["aiProvider"];
  messagingProvider?: OrgSettings["messagingProvider"];
  riskWeights?: OrgSettings["riskWeights"];
  riskThresholds?: OrgSettings["riskThresholds"];
  apiKeysMasked?: OrgSettings["apiKeysMasked"];
  onboarding?: Partial<OrgSettings["onboarding"]>;
};

export function updateSettings(
  orgId: string,
  patch: SettingsPatch,
  actor: string,
) {
  let s = db().settings.find((x) => x.orgId === orgId);
  if (!s) {
    s = defaultSettings(orgId);
    db().settings.push(s);
  }
  if (patch.aiProvider) s.aiProvider = patch.aiProvider;
  if (patch.messagingProvider) s.messagingProvider = patch.messagingProvider;
  if (patch.riskWeights) s.riskWeights = patch.riskWeights;
  if (patch.riskThresholds) s.riskThresholds = patch.riskThresholds;
  if (patch.apiKeysMasked) s.apiKeysMasked = patch.apiKeysMasked;
  if (patch.onboarding) {
    s.onboarding = {
      dismissed: patch.onboarding.dismissed ?? s.onboarding.dismissed,
      completedSteps: patch.onboarding.completedSteps ?? s.onboarding.completedSteps,
    };
  }
  logAudit(orgId, actor, "settings.update", "settings", patch as Record<string, unknown>);
  return s;
}

export function addLead(l: Omit<Lead, "id" | "createdAt">) {
  const lead: Lead = { id: uid("lead"), createdAt: new Date().toISOString(), ...l };
  db().leads.unshift(lead);
  return lead;
}
