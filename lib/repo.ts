// Supabase repository over DIRECT PostgREST fetch (lib/postgrest.ts), NOT
// supabase-js — the latter returns empty reads inside the Next.js production
// runtime. Service-role + explicit org_id filtering on every query; RLS is the
// verified defense-in-depth backstop.
//
// Postgres is snake_case, the domain types are camelCase — each entity has a
// row<->domain mapper.

import bcrypt from "bcryptjs";
import { pgSelect, pgInsert, pgUpdate, eq, ilike } from "./postgrest.ts";
import type {
  Alert, AuditEvent, CaseRecord, Contact, Organization, OrgSettings,
  OutbreakRegion, Profile, ResourceItem, ScreeningRecord, Site, SitRep,
} from "./types";
import type { Lead } from "./store";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---- mappers -------------------------------------------------------------

const mapOrg = (r: any): Organization => ({
  id: r.id, name: r.name, slug: r.slug, mode: r.mode,
  branding: r.branding ?? { primary: "#38bdf8", logoText: "OutbreakOS" },
  createdAt: r.created_at,
});
const mapUser = (r: any): Profile => ({
  id: r.id, orgId: r.org_id, email: r.email, name: r.name, role: r.role,
  siteId: r.site_id ?? undefined, createdAt: r.created_at,
});
const mapSite = (r: any): Site => ({
  id: r.id, orgId: r.org_id, name: r.name, kind: r.kind, country: r.country,
  region: r.region, lat: r.lat, lng: r.lng,
  workersPerDay: r.workers_per_day ?? undefined, status: r.status,
});
const mapRegion = (r: any): OutbreakRegion => ({
  id: r.id, orgId: r.org_id, name: r.name, country: r.country, lat: r.lat, lng: r.lng,
  radiusKm: r.radius_km, confirmed: r.confirmed, suspected: r.suspected, deaths: r.deaths,
  contactsMonitored: r.contacts_monitored, severity: r.severity, trend: r.trend, updatedAt: r.updated_at,
});
const mapCase = (r: any): CaseRecord => ({
  id: r.id, orgId: r.org_id, classification: r.classification, outcome: r.outcome,
  regionId: r.region_id, reportedAt: r.reported_at, notes: r.notes ?? "",
});
const mapScreening = (r: any): ScreeningRecord => ({
  id: r.id, orgId: r.org_id, siteId: r.site_id, context: r.context, subjectName: r.subject_name,
  anonymous: r.anonymous, ageRange: r.age_range, originCountry: r.origin_country ?? "",
  originRegion: r.origin_region ?? "", destination: r.destination ?? "",
  travelHistory: r.travel_history ?? [], contactWithCase: r.contact_with_case,
  symptoms: r.symptoms ?? {}, hcwExposure: r.hcw_exposure, funeralExposure: r.funeral_exposure,
  notes: r.notes ?? "", risk: r.risk, action: r.action, rationale: r.rationale ?? [],
  createdAt: r.created_at, createdBy: r.created_by ?? "",
});
const mapContact = (r: any): Contact => ({
  id: r.id, orgId: r.org_id, name: r.name, phone: r.phone ?? undefined,
  linkedScreeningId: r.linked_screening_id ?? undefined, linkedCaseId: r.linked_case_id ?? undefined,
  monitoringStart: r.monitoring_start, monitoringEnd: r.monitoring_end, status: r.status,
  checkins: r.checkins ?? [], notes: r.notes ?? "",
});
const mapAlert = (r: any): Alert => ({
  id: r.id, orgId: r.org_id, category: r.category, severity: r.severity, title: r.title,
  description: r.description ?? "", status: r.status, owner: r.owner ?? undefined,
  linkedId: r.linked_id ?? undefined, createdAt: r.created_at, resolvedAt: r.resolved_at ?? undefined,
});
const mapResource = (r: any): ResourceItem => ({
  id: r.id, orgId: r.org_id, siteId: r.site_id, category: r.category, label: r.label,
  onHand: r.on_hand, minStock: r.min_stock, burnRatePerDay: r.burn_rate_per_day, unit: r.unit,
});
const mapReport = (r: any): SitRep => ({
  id: r.id, orgId: r.org_id, kind: r.kind, title: r.title, generatedAt: r.generated_at,
  generatedBy: r.generated_by ?? "", aiAssisted: r.ai_assisted, summary: r.summary,
  keyNumbers: r.key_numbers ?? [], hotspots: r.hotspots ?? [], openRisks: r.open_risks ?? [],
  recommended: r.recommended ?? [], changesSinceLast: r.changes_since_last ?? [],
});
const mapAudit = (r: any): AuditEvent => ({
  id: r.id, orgId: r.org_id, actor: r.actor, action: r.action, target: r.target,
  meta: r.meta ?? undefined, createdAt: r.created_at,
});
const mapSettings = (r: any): OrgSettings => ({
  orgId: r.org_id, aiProvider: r.ai_provider, messagingProvider: r.messaging_provider,
  riskWeights: r.risk_weights ?? { fever: 25, bleeding: 40, contact: 30, travel: 20, hcw: 15, funeral: 20 },
  riskThresholds: r.risk_thresholds ?? { monitor: 15, elevated: 40, urgent: 70 },
  apiKeysMasked: r.api_keys_masked ?? [],
  onboarding: r.onboarding ?? { dismissed: false, completedSteps: [] },
});
const mapLead = (r: any): Lead => ({
  id: r.id, email: r.email, name: r.name ?? undefined, org: r.org ?? undefined,
  role: r.role ?? undefined, audience: r.audience ?? undefined, intent: r.intent ?? undefined,
  message: r.message ?? undefined, source: r.source ?? "web", utm: r.utm ?? undefined,
  createdAt: r.created_at,
});

const SETTINGS_DEFAULT_WEIGHTS = { fever: 25, bleeding: 40, contact: 30, travel: 20, hcw: 15, funeral: 20 };

export const repo = {
  // ---- reads (all org-scoped) --------------------------------------------
  async org(orgId: string): Promise<Organization | null> {
    const rows = await pgSelect("organizations", `id=${eq(orgId)}&select=*&limit=1`);
    return rows[0] ? mapOrg(rows[0]) : null;
  },
  async users(orgId: string): Promise<Profile[]> {
    return (await pgSelect("profiles", `org_id=${eq(orgId)}&select=*&order=created_at`)).map(mapUser);
  },
  async sites(orgId: string): Promise<Site[]> {
    return (await pgSelect("sites", `org_id=${eq(orgId)}&select=*&order=created_at`)).map(mapSite);
  },
  async regions(orgId: string): Promise<OutbreakRegion[]> {
    return (await pgSelect("outbreak_regions", `org_id=${eq(orgId)}&select=*`)).map(mapRegion);
  },
  async cases(orgId: string): Promise<CaseRecord[]> {
    return (await pgSelect("cases", `org_id=${eq(orgId)}&select=*`)).map(mapCase);
  },
  async screenings(orgId: string): Promise<ScreeningRecord[]> {
    return (await pgSelect("screenings", `org_id=${eq(orgId)}&select=*&order=created_at.desc`)).map(mapScreening);
  },
  async contacts(orgId: string): Promise<Contact[]> {
    return (await pgSelect("contacts", `org_id=${eq(orgId)}&select=*&order=created_at.desc`)).map(mapContact);
  },
  async alerts(orgId: string): Promise<Alert[]> {
    return (await pgSelect("alerts", `org_id=${eq(orgId)}&select=*&order=created_at.desc`)).map(mapAlert);
  },
  async resources(orgId: string): Promise<ResourceItem[]> {
    return (await pgSelect("resources", `org_id=${eq(orgId)}&select=*`)).map(mapResource);
  },
  async reports(orgId: string): Promise<SitRep[]> {
    return (await pgSelect("reports", `org_id=${eq(orgId)}&select=*&order=generated_at.desc`)).map(mapReport);
  },
  async audit(orgId: string): Promise<AuditEvent[]> {
    return (await pgSelect("audit_logs", `org_id=${eq(orgId)}&select=*&order=created_at.desc&limit=500`)).map(mapAudit);
  },
  async settings(orgId: string): Promise<OrgSettings> {
    const rows = await pgSelect("org_settings", `org_id=${eq(orgId)}&select=*&limit=1`);
    return rows[0] ? mapSettings(rows[0]) : mapSettings({ org_id: orgId });
  },
  async leads(): Promise<Lead[]> {
    return (await pgSelect("leads", `select=*&order=created_at.desc`)).map(mapLead);
  },

  // ---- auth helpers ------------------------------------------------------
  async userByEmail(email: string): Promise<Profile | null> {
    const rows = await pgSelect("profiles", `email=${ilike(email)}&select=*&limit=1`);
    return rows[0] ? mapUser(rows[0]) : null;
  },
  async userById(id: string): Promise<Profile | null> {
    const rows = await pgSelect("profiles", `id=${eq(id)}&select=*&limit=1`);
    return rows[0] ? mapUser(rows[0]) : null;
  },
  async sessionVersion(userId: string): Promise<number> {
    const rows = await pgSelect<any>("profiles", `id=${eq(userId)}&select=session_version&limit=1`);
    return rows[0]?.session_version ?? 1;
  },
  async isDeactivated(userId: string): Promise<boolean> {
    const rows = await pgSelect<any>("profiles", `id=${eq(userId)}&select=deactivated&limit=1`);
    return rows[0]?.deactivated ?? false;
  },
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    if (await this.isDeactivated(userId)) return false;
    const rows = await pgSelect<any>("user_credentials", `user_id=${eq(userId)}&select=password_hash&limit=1`);
    const hash = rows[0]?.password_hash;
    return hash ? bcrypt.compareSync(password, hash) : false;
  },

  // ---- mutations ---------------------------------------------------------
  async logAudit(orgId: string, actor: string, action: string, target: string, meta?: Record<string, unknown>) {
    await pgInsert("audit_logs", { org_id: orgId, actor, action, target, meta: meta ?? null });
  },
  async createOrg(name: string, mode: Organization["mode"] = "standard"): Promise<Organization> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
    const rows = await pgInsert("organizations", { name, slug, mode, branding: { primary: "#38bdf8", logoText: "OutbreakOS" } });
    const org = mapOrg(rows[0]);
    await pgInsert("org_settings", { org_id: org.id, risk_weights: SETTINGS_DEFAULT_WEIGHTS });
    return org;
  },
  async createUser(orgId: string, p: Omit<Profile, "id" | "orgId" | "createdAt">, password: string): Promise<Profile> {
    // profiles.id has no DB default (mirrors auth.users.id in the Supabase Auth
    // model); this app uses its own cookie auth, so we mint the id here.
    const id = crypto.randomUUID();
    const rows = await pgInsert("profiles", { id, org_id: orgId, email: p.email, name: p.name, role: p.role, site_id: p.siteId ?? null });
    const user = mapUser(rows[0]);
    await pgInsert("user_credentials", { user_id: user.id, password_hash: bcrypt.hashSync(password, 10) });
    return user;
  },
  async setPassword(userId: string, password: string) {
    // upsert credential
    const existing = await pgSelect<any>("user_credentials", `user_id=${eq(userId)}&select=user_id&limit=1`);
    if (existing[0]) {
      await pgUpdate("user_credentials", `user_id=${eq(userId)}`, { password_hash: bcrypt.hashSync(password, 10), updated_at: new Date().toISOString() });
    } else {
      await pgInsert("user_credentials", { user_id: userId, password_hash: bcrypt.hashSync(password, 10) });
    }
    await this.revokeSessions(userId);
  },
  async revokeSessions(userId: string): Promise<number> {
    const v = (await this.sessionVersion(userId)) + 1;
    await pgUpdate("profiles", `id=${eq(userId)}`, { session_version: v });
    return v;
  },
  async setActive(orgId: string, userId: string, active: boolean) {
    const rows = await pgUpdate("profiles", `id=${eq(userId)}&org_id=${eq(orgId)}`, { deactivated: !active });
    if (rows[0] && !active) await this.revokeSessions(userId);
    return rows[0] ? mapUser(rows[0]) : null;
  },
  async changeRole(orgId: string, userId: string, role: Profile["role"]) {
    const rows = await pgUpdate("profiles", `id=${eq(userId)}&org_id=${eq(orgId)}`, { role });
    if (rows[0]) await this.revokeSessions(userId);
    return rows[0] ? mapUser(rows[0]) : null;
  },
  async createSetPasswordToken(userId: string): Promise<string> {
    const token = Buffer.from(`${userId}:${crypto.randomUUID()}`).toString("base64url");
    await pgInsert("set_password_tokens", { token, user_id: userId });
    return token;
  },
  async consumeSetPasswordToken(token: string, password: string): Promise<Profile | null> {
    const rows = await pgSelect<any>("set_password_tokens", `token=${eq(token)}&used_at=is.null&select=*&limit=1`);
    const row = rows[0];
    if (!row) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) return null;
    await this.setPassword(row.user_id, password);
    await pgUpdate("set_password_tokens", `token=${eq(token)}`, { used_at: new Date().toISOString() });
    await pgUpdate("profiles", `id=${eq(row.user_id)}`, { deactivated: false });
    return this.userById(row.user_id);
  },
  async addScreening(orgId: string, actor: string, rec: Omit<ScreeningRecord, "id" | "orgId" | "createdAt">): Promise<ScreeningRecord> {
    const rows = await pgInsert("screenings", {
      org_id: orgId, site_id: rec.siteId, context: rec.context, subject_name: rec.subjectName,
      anonymous: rec.anonymous, age_range: rec.ageRange, origin_country: rec.originCountry,
      origin_region: rec.originRegion, destination: rec.destination, travel_history: rec.travelHistory,
      contact_with_case: rec.contactWithCase, symptoms: rec.symptoms, hcw_exposure: rec.hcwExposure,
      funeral_exposure: rec.funeralExposure, notes: rec.notes, risk: rec.risk, action: rec.action,
      rationale: rec.rationale, created_by: actor,
    });
    const screening = mapScreening(rows[0]);
    await this.logAudit(orgId, actor, "screening.create", screening.id);
    if (screening.risk === "urgent" || screening.risk === "elevated") {
      await this.addAlert(orgId, "system", {
        category: "high_risk_screening", severity: screening.risk === "urgent" ? "critical" : "high",
        title: `${screening.risk === "urgent" ? "Urgent" : "Elevated"} operational tier — ${screening.subjectName}`,
        description: `${screening.context.replace("_", " ")} screening produced ${screening.risk} tier. Action: ${screening.action}`,
        linkedId: screening.id,
      });
    }
    if (["monitor", "elevated", "urgent"].includes(screening.risk)) {
      await this.addContact(orgId, "system", {
        name: `Contact-${screening.id.slice(-6).toUpperCase()}`, linkedScreeningId: screening.id,
        monitoringStart: new Date().toISOString(), monitoringEnd: new Date(Date.now() + 21 * 86400000).toISOString(),
        status: screening.risk === "urgent" ? "escalated" : "active",
        checkins: [{ day: 1, date: new Date().toISOString(), status: "ok" }],
        notes: `Auto-enrolled from ${screening.context} screening`,
      });
    }
    return screening;
  },
  async addContact(orgId: string, actor: string, c: Omit<Contact, "id" | "orgId">): Promise<Contact> {
    const rows = await pgInsert("contacts", {
      org_id: orgId, name: c.name, phone: c.phone ?? null, linked_screening_id: c.linkedScreeningId ?? null,
      linked_case_id: c.linkedCaseId ?? null, monitoring_start: c.monitoringStart, monitoring_end: c.monitoringEnd,
      status: c.status, checkins: c.checkins, notes: c.notes,
    });
    await this.logAudit(orgId, actor, "contact.create", (rows[0] as any).id);
    return mapContact(rows[0]);
  },
  async updateContactStatus(orgId: string, id: string, status: Contact["status"], actor: string) {
    const rows = await pgUpdate("contacts", `id=${eq(id)}&org_id=${eq(orgId)}`, { status });
    if (rows[0]) await this.logAudit(orgId, actor, "contact.update", id, { status });
    return rows[0] ? mapContact(rows[0]) : null;
  },
  async logCheckin(orgId: string, id: string, day: number, status: "ok" | "symptom" | "missed", actor: string) {
    const got = await pgSelect("contacts", `id=${eq(id)}&org_id=${eq(orgId)}&select=*&limit=1`);
    if (!got[0]) return null;
    const c = mapContact(got[0]);
    const existing = c.checkins.find((x) => x.day === day);
    if (existing) { existing.status = status; existing.date = new Date().toISOString(); }
    else { c.checkins.push({ day, date: new Date().toISOString(), status }); c.checkins.sort((a, b) => a.day - b.day); }
    const rows = await pgUpdate("contacts", `id=${eq(id)}&org_id=${eq(orgId)}`, { checkins: c.checkins });
    await this.logAudit(orgId, actor, "contact.checkin", id, { day, status });
    return mapContact(rows[0]);
  },
  async addAlert(orgId: string, actor: string, a: Omit<Alert, "id" | "orgId" | "createdAt" | "status">): Promise<Alert> {
    const rows = await pgInsert("alerts", {
      org_id: orgId, category: a.category, severity: a.severity, title: a.title,
      description: a.description, status: "open", owner: a.owner ?? null, linked_id: a.linkedId ?? null,
    });
    await this.logAudit(orgId, actor, "alert.create", (rows[0] as any).id);
    return mapAlert(rows[0]);
  },
  async setAlertStatus(orgId: string, id: string, status: Alert["status"], actor: string) {
    const patch: Record<string, unknown> = { status };
    if (status === "resolved") patch.resolved_at = new Date().toISOString();
    const rows = await pgUpdate("alerts", `id=${eq(id)}&org_id=${eq(orgId)}`, patch);
    if (rows[0]) await this.logAudit(orgId, actor, `alert.${status}`, id);
    return rows[0] ? mapAlert(rows[0]) : null;
  },
  async adjustResource(orgId: string, id: string, delta: number, actor: string, reason: string) {
    const got = await pgSelect<any>("resources", `id=${eq(id)}&org_id=${eq(orgId)}&select=on_hand&limit=1`);
    if (!got[0]) return null;
    const onHand = Math.max(0, got[0].on_hand + delta);
    const rows = await pgUpdate("resources", `id=${eq(id)}&org_id=${eq(orgId)}`, { on_hand: onHand });
    await this.logAudit(orgId, actor, "resource.update", id, { delta, reason });
    return mapResource(rows[0]);
  },
  async addReport(rpt: Omit<SitRep, "id">): Promise<SitRep> {
    const rows = await pgInsert("reports", {
      org_id: rpt.orgId, kind: rpt.kind, title: rpt.title, generated_by: rpt.generatedBy,
      ai_assisted: rpt.aiAssisted, summary: rpt.summary, key_numbers: rpt.keyNumbers, hotspots: rpt.hotspots,
      open_risks: rpt.openRisks, recommended: rpt.recommended, changes_since_last: rpt.changesSinceLast,
    });
    await this.logAudit(rpt.orgId, rpt.generatedBy, "report.generate", (rows[0] as any).id);
    return mapReport(rows[0]);
  },
  async createSite(orgId: string, actor: string, s: Omit<Site, "id" | "orgId">): Promise<Site> {
    const rows = await pgInsert("sites", {
      org_id: orgId, name: s.name, kind: s.kind, country: s.country, region: s.region,
      lat: s.lat, lng: s.lng, workers_per_day: s.workersPerDay ?? null, status: s.status,
    });
    await this.logAudit(orgId, actor, "site.create", (rows[0] as any).id);
    return mapSite(rows[0]);
  },
  async updateSettings(orgId: string, patch: Partial<OrgSettings>, actor: string): Promise<OrgSettings> {
    const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.aiProvider) dbPatch.ai_provider = patch.aiProvider;
    if (patch.messagingProvider) dbPatch.messaging_provider = patch.messagingProvider;
    if (patch.riskWeights) dbPatch.risk_weights = patch.riskWeights;
    if (patch.riskThresholds) dbPatch.risk_thresholds = patch.riskThresholds;
    if (patch.onboarding) dbPatch.onboarding = patch.onboarding;
    const rows = await pgUpdate("org_settings", `org_id=${eq(orgId)}`, dbPatch);
    await this.logAudit(orgId, actor, "settings.update", "settings", patch as Record<string, unknown>);
    return rows[0] ? mapSettings(rows[0]) : mapSettings({ org_id: orgId });
  },
  async addLead(l: Omit<Lead, "id" | "createdAt">): Promise<Lead> {
    const rows = await pgInsert("leads", {
      email: l.email, name: l.name ?? null, org: l.org ?? null, role: l.role ?? null,
      audience: l.audience ?? null, intent: l.intent ?? null, message: l.message ?? null,
      source: l.source, utm: l.utm ?? {},
    });
    return mapLead(rows[0]);
  },
  async addNotification(orgId: string, n: { channel: string; target: string; subject: string; body: string; severity: string; status: string; error?: string }) {
    await pgInsert("notifications", {
      org_id: orgId, channel: n.channel, target: n.target, subject: n.subject, body: n.body,
      severity: n.severity, status: n.status, error: n.error ?? null,
    });
  },
};
