// Persistence layer (async). Two interchangeable backends behind ONE interface:
//   - repo (Supabase/Postgres)  — used whenever Supabase is configured
//   - memBackend (in-process)    — local dev / CI / tests only
//
// Production sets REQUIRE_PERSISTENCE=true; the persistence guard refuses to
// serve unless Supabase is configured, so production NEVER uses memBackend.
//
// CRITICAL: every accessor/mutation is org-scoped. Do not bypass.

import {
  DEMO_ALERTS, DEMO_AUDIT, DEMO_CASES, DEMO_CONTACTS, DEMO_ORG, DEMO_REGIONS,
  DEMO_REPORTS, DEMO_RESOURCES, DEMO_SCREENINGS, DEMO_SETTINGS, DEMO_SITES, DEMO_USERS,
} from "./demo-data.ts";
import bcrypt from "bcryptjs";
import type {
  Alert, AuditEvent, CaseRecord, Contact, Organization, OrgSettings,
  OutbreakRegion, Profile, ResourceItem, ScreeningRecord, Site, SitRep,
} from "./types";
import { uid } from "./utils.ts";
import { repo } from "./repo.ts";
import { isSupabaseConfigured } from "./supabase/server.ts";

export interface Lead {
  id: string; email: string; name?: string; org?: string; role?: string;
  audience?: string; intent?: string; message?: string; source: string;
  utm?: Record<string, string>; createdAt: string;
}

// ============================================================
// In-memory backend (dev / CI / tests only)
// ============================================================

interface Db {
  orgs: Organization[]; users: Profile[]; sites: Site[]; regions: OutbreakRegion[];
  cases: CaseRecord[]; screenings: ScreeningRecord[]; contacts: Contact[]; alerts: Alert[];
  resources: ResourceItem[]; reports: SitRep[]; audit: AuditEvent[]; settings: OrgSettings[];
  leads: Lead[]; notifications: { orgId: string; [k: string]: unknown }[];
  passwords: Map<string, string>; sessionVersions: Map<string, number>;
  deactivated: Set<string>; setPasswordTokens: Map<string, string>;
}

const g = globalThis as unknown as { __outbreakos_db?: Db };
const DEMO_PASSWORD_HASH = "$2b$10$ED/EieG.N/CxSMaULD5Lk.Svcg1Xo3gi7U60ICo11ri5uoe88Zor6";

function freshDb(): Db {
  const passwords = new Map<string, string>();
  for (const u of DEMO_USERS) passwords.set(u.id, DEMO_PASSWORD_HASH);
  return {
    orgs: [structuredClone(DEMO_ORG)], users: structuredClone(DEMO_USERS),
    sites: structuredClone(DEMO_SITES), regions: structuredClone(DEMO_REGIONS),
    cases: structuredClone(DEMO_CASES), screenings: structuredClone(DEMO_SCREENINGS),
    contacts: structuredClone(DEMO_CONTACTS), alerts: structuredClone(DEMO_ALERTS),
    resources: structuredClone(DEMO_RESOURCES), reports: structuredClone(DEMO_REPORTS),
    audit: structuredClone(DEMO_AUDIT), settings: [structuredClone(DEMO_SETTINGS)],
    leads: [], notifications: [],
    passwords, sessionVersions: new Map(DEMO_USERS.map((u) => [u.id, 1])),
    deactivated: new Set<string>(), setPasswordTokens: new Map<string, string>(),
  };
}

if (!g.__outbreakos_db) g.__outbreakos_db = freshDb();
export function db(): Db {
  return g.__outbreakos_db!;
}
export function resetDb() {
  g.__outbreakos_db = freshDb();
}

function defaultSettings(orgId: string): OrgSettings {
  return {
    orgId, aiProvider: "none", messagingProvider: "none",
    riskWeights: { fever: 25, bleeding: 40, contact: 30, travel: 20, hcw: 15, funeral: 20 },
    riskThresholds: { monitor: 15, elevated: 40, urgent: 70 },
    apiKeysMasked: [], onboarding: { dismissed: false, completedSteps: [] },
  };
}

function memAudit(orgId: string, actor: string, action: string, target: string, meta?: Record<string, unknown>) {
  db().audit.unshift({ id: uid("a"), orgId, actor, action, target, meta, createdAt: new Date().toISOString() });
}

// memBackend mirrors the repo interface exactly so the two are interchangeable.
const memBackend = {
  async org(orgId: string) { return db().orgs.find((o) => o.id === orgId) || null; },
  async users(orgId: string) { return db().users.filter((u) => u.orgId === orgId); },
  async sites(orgId: string) { return db().sites.filter((s) => s.orgId === orgId); },
  async regions(orgId: string) { return db().regions.filter((r) => r.orgId === orgId); },
  async cases(orgId: string) { return db().cases.filter((c) => c.orgId === orgId); },
  async screenings(orgId: string) { return db().screenings.filter((s) => s.orgId === orgId); },
  async contacts(orgId: string) { return db().contacts.filter((c) => c.orgId === orgId); },
  async alerts(orgId: string) { return db().alerts.filter((a) => a.orgId === orgId); },
  async resources(orgId: string) { return db().resources.filter((r) => r.orgId === orgId); },
  async reports(orgId: string) { return db().reports.filter((r) => r.orgId === orgId); },
  async audit(orgId: string) { return db().audit.filter((a) => a.orgId === orgId); },
  async settings(orgId: string) { return db().settings.find((s) => s.orgId === orgId) || defaultSettings(orgId); },
  async leads() { return db().leads; },

  async userByEmail(email: string) { return db().users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null; },
  async userById(id: string) { return db().users.find((u) => u.id === id) || null; },
  async sessionVersion(userId: string) { return db().sessionVersions.get(userId) ?? 1; },
  async isDeactivated(userId: string) { return db().deactivated.has(userId); },
  async verifyPassword(userId: string, password: string) {
    if (db().deactivated.has(userId)) return false;
    const hash = db().passwords.get(userId);
    return hash ? bcrypt.compareSync(password, hash) : false;
  },

  async logAudit(orgId: string, actor: string, action: string, target: string, meta?: Record<string, unknown>) {
    memAudit(orgId, actor, action, target, meta);
  },
  async createOrg(name: string, mode: Organization["mode"] = "standard") {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + uid("").slice(1, 5);
    const org: Organization = { id: uid("org"), name, slug, mode, branding: { primary: "#38bdf8", logoText: "OutbreakOS" }, createdAt: new Date().toISOString() };
    db().orgs.push(org);
    db().settings.push(defaultSettings(org.id));
    return org;
  },
  async createUser(orgId: string, p: Omit<Profile, "id" | "orgId" | "createdAt">, password: string) {
    const user: Profile = { id: uid("u"), orgId, createdAt: new Date().toISOString(), ...p };
    db().users.unshift(user);
    db().passwords.set(user.id, bcrypt.hashSync(password, 10));
    db().sessionVersions.set(user.id, 1);
    return user;
  },
  async setPassword(userId: string, password: string) {
    db().passwords.set(userId, bcrypt.hashSync(password, 10));
    return this.revokeSessions(userId);
  },
  async revokeSessions(userId: string) {
    const v = (db().sessionVersions.get(userId) ?? 1) + 1;
    db().sessionVersions.set(userId, v);
    return v;
  },
  async setActive(orgId: string, userId: string, active: boolean) {
    const u = db().users.find((x) => x.id === userId && x.orgId === orgId);
    if (!u) return null;
    if (active) db().deactivated.delete(userId);
    else { db().deactivated.add(userId); await this.revokeSessions(userId); }
    return u;
  },
  async changeRole(orgId: string, userId: string, role: Profile["role"]) {
    const u = db().users.find((x) => x.id === userId && x.orgId === orgId);
    if (!u) return null;
    u.role = role;
    await this.revokeSessions(userId);
    return u;
  },
  async createSetPasswordToken(userId: string) {
    const token = Buffer.from(`${userId}:${uid("set")}`).toString("base64url");
    db().setPasswordTokens.set(token, userId);
    return token;
  },
  async consumeSetPasswordToken(token: string, password: string) {
    const userId = db().setPasswordTokens.get(token);
    if (!userId) return null;
    const user = db().users.find((u) => u.id === userId);
    if (!user) return null;
    db().passwords.set(userId, bcrypt.hashSync(password, 10));
    db().deactivated.delete(userId);
    db().setPasswordTokens.delete(token);
    return user;
  },
  async addScreening(orgId: string, actor: string, rec: Omit<ScreeningRecord, "id" | "orgId" | "createdAt">) {
    const full: ScreeningRecord = { id: uid("scr"), orgId, createdAt: new Date().toISOString(), ...rec };
    db().screenings.unshift(full);
    memAudit(orgId, actor, "screening.create", full.id);
    if (full.risk === "urgent" || full.risk === "elevated") {
      await this.addAlert(orgId, "system", {
        category: "high_risk_screening", severity: full.risk === "urgent" ? "critical" : "high",
        title: `${full.risk === "urgent" ? "Urgent" : "Elevated"} operational tier — ${full.subjectName}`,
        description: `${full.context.replace("_", " ")} screening produced ${full.risk} tier. Action: ${full.action}`,
        linkedId: full.id,
      });
    }
    if (["monitor", "elevated", "urgent"].includes(full.risk)) {
      await this.addContact(orgId, "system", {
        name: `Contact-${full.id.slice(-6).toUpperCase()}`, linkedScreeningId: full.id,
        monitoringStart: new Date().toISOString(), monitoringEnd: new Date(Date.now() + 21 * 86400000).toISOString(),
        status: full.risk === "urgent" ? "escalated" : "active",
        checkins: [{ day: 1, date: new Date().toISOString(), status: "ok" }],
        notes: `Auto-enrolled from ${full.context} screening`,
      });
    }
    return full;
  },
  async addContact(orgId: string, actor: string, c: Omit<Contact, "id" | "orgId">) {
    const full: Contact = { id: uid("ct"), orgId, ...c };
    db().contacts.unshift(full);
    memAudit(orgId, actor, "contact.create", full.id);
    return full;
  },
  async updateContactStatus(orgId: string, id: string, status: Contact["status"], actor: string) {
    const c = db().contacts.find((x) => x.id === id && x.orgId === orgId);
    if (!c) return null;
    c.status = status;
    memAudit(orgId, actor, "contact.update", id, { status });
    return c;
  },
  async logCheckin(orgId: string, id: string, day: number, status: "ok" | "symptom" | "missed", actor: string) {
    const c = db().contacts.find((x) => x.id === id && x.orgId === orgId);
    if (!c) return null;
    const existing = c.checkins.find((x) => x.day === day);
    if (existing) { existing.status = status; existing.date = new Date().toISOString(); }
    else { c.checkins.push({ day, date: new Date().toISOString(), status }); c.checkins.sort((a, b) => a.day - b.day); }
    memAudit(orgId, actor, "contact.checkin", id, { day, status });
    return c;
  },
  async addAlert(orgId: string, actor: string, a: Omit<Alert, "id" | "orgId" | "createdAt" | "status">) {
    const full: Alert = { id: uid("al"), orgId, createdAt: new Date().toISOString(), status: "open", ...a };
    db().alerts.unshift(full);
    memAudit(orgId, actor, "alert.create", full.id);
    return full;
  },
  async setAlertStatus(orgId: string, id: string, status: Alert["status"], actor: string) {
    const a = db().alerts.find((x) => x.id === id && x.orgId === orgId);
    if (!a) return null;
    a.status = status;
    if (status === "resolved") a.resolvedAt = new Date().toISOString();
    memAudit(orgId, actor, `alert.${status}`, id);
    return a;
  },
  async adjustResource(orgId: string, id: string, delta: number, actor: string, reason: string) {
    const r = db().resources.find((x) => x.id === id && x.orgId === orgId);
    if (!r) return null;
    r.onHand = Math.max(0, r.onHand + delta);
    memAudit(orgId, actor, "resource.update", id, { delta, reason });
    return r;
  },
  async addReport(rpt: Omit<SitRep, "id">) {
    const full: SitRep = { ...rpt, id: uid("rpt") };
    db().reports.unshift(full);
    memAudit(rpt.orgId, full.generatedBy, "report.generate", full.id);
    return full;
  },
  async createSite(orgId: string, actor: string, s: Omit<Site, "id" | "orgId">) {
    const site: Site = { id: uid("site"), orgId, ...s };
    db().sites.push(site);
    memAudit(orgId, actor, "site.create", site.id);
    return site;
  },
  async updateSettings(orgId: string, patch: Partial<OrgSettings>, actor: string) {
    let s = db().settings.find((x) => x.orgId === orgId);
    if (!s) { s = defaultSettings(orgId); db().settings.push(s); }
    if (patch.aiProvider) s.aiProvider = patch.aiProvider;
    if (patch.messagingProvider) s.messagingProvider = patch.messagingProvider;
    if (patch.riskWeights) s.riskWeights = patch.riskWeights;
    if (patch.riskThresholds) s.riskThresholds = patch.riskThresholds;
    if (patch.apiKeysMasked) s.apiKeysMasked = patch.apiKeysMasked;
    if (patch.onboarding) s.onboarding = { dismissed: patch.onboarding.dismissed ?? s.onboarding.dismissed, completedSteps: patch.onboarding.completedSteps ?? s.onboarding.completedSteps };
    memAudit(orgId, actor, "settings.update", "settings", patch as Record<string, unknown>);
    return s;
  },
  async addLead(l: Omit<Lead, "id" | "createdAt">) {
    const lead: Lead = { id: uid("lead"), createdAt: new Date().toISOString(), ...l };
    db().leads.unshift(lead);
    return lead;
  },
  async addNotification(orgId: string, n: { channel: string; target: string; subject: string; body: string; severity: string; status: string; error?: string }) {
    db().notifications.unshift({ orgId, ...n, createdAt: new Date().toISOString() });
  },
};

// ============================================================
// Backend selection — Supabase in prod, in-memory for dev/CI/tests
// ============================================================

const backend = isSupabaseConfigured() ? repo : memBackend;

// ============================================================
// PUBLIC ASYNC API (stable import surface for the app)
// ============================================================

export const data = {
  org: (orgId: string) => backend.org(orgId),
  users: (orgId: string) => backend.users(orgId),
  sites: (orgId: string) => backend.sites(orgId),
  regions: (orgId: string) => backend.regions(orgId),
  cases: (orgId: string) => backend.cases(orgId),
  screenings: (orgId: string) => backend.screenings(orgId),
  contacts: (orgId: string) => backend.contacts(orgId),
  alerts: (orgId: string) => backend.alerts(orgId),
  resources: (orgId: string) => backend.resources(orgId),
  reports: (orgId: string) => backend.reports(orgId),
  audit: (orgId: string) => backend.audit(orgId),
  settings: (orgId: string) => backend.settings(orgId),
  leads: () => backend.leads(),
};

export const logAudit = (orgId: string, actor: string, action: string, target: string, meta?: Record<string, unknown>) =>
  backend.logAudit(orgId, actor, action, target, meta);

export const createOrg = (name: string, mode?: Organization["mode"]) => backend.createOrg(name, mode);
export const createUser = (orgId: string, p: Omit<Profile, "id" | "orgId" | "createdAt">, password: string) => backend.createUser(orgId, p, password);
export const verifyPassword = (userId: string, password: string) => backend.verifyPassword(userId, password);
export const userByEmail = (email: string) => backend.userByEmail(email);
export const userById = (id: string) => backend.userById(id);
export const currentSessionVersion = (userId: string) => backend.sessionVersion(userId);
export const isDeactivated = (userId: string) => backend.isDeactivated(userId);

export async function revokeUserSessions(userId: string, actor: string, orgId: string) {
  const v = await backend.revokeSessions(userId);
  await backend.logAudit(orgId, actor, "session.revoke_all", userId, { newVersion: v });
  return v;
}
export async function setPassword(userId: string, password: string, actor: string, orgId: string) {
  await backend.setPassword(userId, password);
  await backend.logAudit(orgId, actor, "user.password_set", userId);
}
export async function inviteUser(orgId: string, actor: string, email: string, name: string, role: Profile["role"]) {
  const tempPassword = uid("tmp") + uid("");
  const user = await backend.createUser(orgId, { email, name, role }, tempPassword);
  const token = await backend.createSetPasswordToken(user.id);
  await backend.logAudit(orgId, actor, "user.invite", user.id, { email, role });
  return { user, token };
}
export const consumeSetPasswordToken = (token: string, password: string) => backend.consumeSetPasswordToken(token, password);
export async function changeUserRole(orgId: string, userId: string, role: Profile["role"], actor: string) {
  const u = await backend.changeRole(orgId, userId, role);
  if (u) await backend.logAudit(orgId, actor, "user.role_change", userId, { role });
  return u;
}
export async function setUserActive(orgId: string, userId: string, active: boolean, actor: string) {
  const u = await backend.setActive(orgId, userId, active);
  if (u) await backend.logAudit(orgId, actor, active ? "user.reactivate" : "user.deactivate", userId);
  return u;
}

export const addScreening = (orgId: string, actor: string, rec: Omit<ScreeningRecord, "id" | "orgId" | "createdAt">) => backend.addScreening(orgId, actor, rec);
export const addContact = (orgId: string, actor: string, c: Omit<Contact, "id" | "orgId">) => backend.addContact(orgId, actor, c);
export const updateContactStatus = (orgId: string, id: string, status: Contact["status"], actor: string) => backend.updateContactStatus(orgId, id, status, actor);
export const logCheckin = (orgId: string, id: string, day: number, status: "ok" | "symptom" | "missed", actor: string) => backend.logCheckin(orgId, id, day, status, actor);
export const addAlert = (orgId: string, actor: string, a: Omit<Alert, "id" | "orgId" | "createdAt" | "status">) => backend.addAlert(orgId, actor, a);
export const setAlertStatus = (orgId: string, id: string, status: Alert["status"], actor: string) => backend.setAlertStatus(orgId, id, status, actor);
export const adjustResource = (orgId: string, id: string, delta: number, actor: string, reason: string) => backend.adjustResource(orgId, id, delta, actor, reason);
export const addReport = (rpt: Omit<SitRep, "id">) => backend.addReport(rpt);
export const createSite = (orgId: string, actor: string, s: Omit<Site, "id" | "orgId">) => backend.createSite(orgId, actor, s);
export type SettingsInput = Partial<Omit<OrgSettings, "orgId" | "onboarding">> & {
  onboarding?: Partial<OrgSettings["onboarding"]>;
};
export const updateSettings = (orgId: string, patch: SettingsInput, actor: string) =>
  backend.updateSettings(orgId, patch as Partial<OrgSettings>, actor);
export const addLead = (l: Omit<Lead, "id" | "createdAt">) => backend.addLead(l);
export const addNotification = (orgId: string, n: { channel: string; target: string; subject: string; body: string; severity: string; status: string; error?: string }) => backend.addNotification(orgId, n);
