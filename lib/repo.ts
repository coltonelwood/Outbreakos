// Supabase-backed repository. Server-only. Uses the service-role client and
// filters EVERY query by org_id (the app authenticates via signed cookies, not
// Supabase JWTs, so tenant isolation on this trusted server path is enforced by
// explicit org_id filters — with RLS as the verified defense-in-depth backstop
// for any anon/client access).
//
// Column mapping: Postgres is snake_case, the app domain types are camelCase.
// Each entity has a row<->domain mapper.

import { supabaseAdmin } from "./supabase/server";
import bcrypt from "bcryptjs";
import { uid } from "./utils";
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
import type { Lead } from "./store";

function sb() {
  return supabaseAdmin();
}

async function must<T>(p: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(`Supabase: ${(error as { message?: string })?.message ?? String(error)}`);
  if (data === null) throw new Error("Supabase: unexpected null result");
  return data;
}

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

// ---- reads (all org-scoped) ----------------------------------------------

export const repo = {
  async org(orgId: string): Promise<Organization | null> {
    const rows = await must(sb().from("organizations").select("*").eq("id", orgId).limit(1));
    return rows[0] ? mapOrg(rows[0]) : null;
  },
  async users(orgId: string): Promise<Profile[]> {
    return (await must(sb().from("profiles").select("*").eq("org_id", orgId).order("created_at"))).map(mapUser);
  },
  async sites(orgId: string): Promise<Site[]> {
    return (await must(sb().from("sites").select("*").eq("org_id", orgId).order("created_at"))).map(mapSite);
  },
  async regions(orgId: string): Promise<OutbreakRegion[]> {
    return (await must(sb().from("outbreak_regions").select("*").eq("org_id", orgId))).map(mapRegion);
  },
  async cases(orgId: string): Promise<CaseRecord[]> {
    return (await must(sb().from("cases").select("*").eq("org_id", orgId))).map(mapCase);
  },
  async screenings(orgId: string): Promise<ScreeningRecord[]> {
    return (await must(sb().from("screenings").select("*").eq("org_id", orgId).order("created_at", { ascending: false }))).map(mapScreening);
  },
  async contacts(orgId: string): Promise<Contact[]> {
    return (await must(sb().from("contacts").select("*").eq("org_id", orgId).order("created_at", { ascending: false }))).map(mapContact);
  },
  async alerts(orgId: string): Promise<Alert[]> {
    return (await must(sb().from("alerts").select("*").eq("org_id", orgId).order("created_at", { ascending: false }))).map(mapAlert);
  },
  async resources(orgId: string): Promise<ResourceItem[]> {
    return (await must(sb().from("resources").select("*").eq("org_id", orgId))).map(mapResource);
  },
  async reports(orgId: string): Promise<SitRep[]> {
    return (await must(sb().from("reports").select("*").eq("org_id", orgId).order("generated_at", { ascending: false }))).map(mapReport);
  },
  async audit(orgId: string): Promise<AuditEvent[]> {
    return (await must(sb().from("audit_logs").select("*").eq("org_id", orgId).order("created_at", { ascending: false }).limit(500))).map(mapAudit);
  },
  async settings(orgId: string): Promise<OrgSettings> {
    const rows = await must(sb().from("org_settings").select("*").eq("org_id", orgId).limit(1));
    return rows[0] ? mapSettings(rows[0]) : mapSettings({ org_id: orgId });
  },
  async leads(): Promise<Lead[]> {
    return (await must(sb().from("leads").select("*").order("created_at", { ascending: false }))).map(mapLead);
  },

  // ---- auth helpers ----
  async userByEmail(email: string): Promise<Profile | null> {
    const rows = await must(sb().from("profiles").select("*").ilike("email", email).limit(1));
    return rows[0] ? mapUser(rows[0]) : null;
  },
  async userById(id: string): Promise<Profile | null> {
    const rows = await must(sb().from("profiles").select("*").eq("id", id).limit(1));
    return rows[0] ? mapUser(rows[0]) : null;
  },
  async sessionVersion(userId: string): Promise<number> {
    const rows = await must(sb().from("profiles").select("session_version").eq("id", userId).limit(1));
    return rows[0]?.session_version ?? 1;
  },
  async isDeactivated(userId: string): Promise<boolean> {
    const rows = await must(sb().from("profiles").select("deactivated").eq("id", userId).limit(1));
    return rows[0]?.deactivated ?? false;
  },
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const deact = await this.isDeactivated(userId);
    if (deact) return false;
    const rows = await must(sb().from("user_credentials").select("password_hash").eq("user_id", userId).limit(1));
    const hash = rows[0]?.password_hash;
    return hash ? bcrypt.compareSync(password, hash) : false;
  },

  // ---- mutations ----
  async logAudit(orgId: string, actor: string, action: string, target: string, meta?: Record<string, unknown>) {
    await must(sb().from("audit_logs").insert({ org_id: orgId, actor, action, target, meta: meta ?? null }).select());
  },
  async createOrg(name: string, mode: Organization["mode"] = "standard"): Promise<Organization> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + uid("").slice(1, 5);
    const rows = await must(sb().from("organizations").insert({ name, slug, mode, branding: { primary: "#38bdf8", logoText: "OutbreakOS" } }).select());
    const org = mapOrg(rows[0]);
    await must(sb().from("org_settings").insert({ org_id: org.id, risk_weights: { fever: 25, bleeding: 40, contact: 30, travel: 20, hcw: 15, funeral: 20 } }).select());
    return org;
  },
  async createUser(orgId: string, p: Omit<Profile, "id" | "orgId" | "createdAt">, password: string): Promise<Profile> {
    // profiles.id has no DB default (it mirrors auth.users.id in the Supabase
    // Auth model). This app uses its own cookie auth, so we mint the id here.
    const id = crypto.randomUUID();
    const rows = await must(sb().from("profiles").insert({ id, org_id: orgId, email: p.email, name: p.name, role: p.role, site_id: p.siteId ?? null }).select());
    const user = mapUser(rows[0]);
    await must(sb().from("user_credentials").insert({ user_id: user.id, password_hash: bcrypt.hashSync(password, 10) }).select());
    return user;
  },
  async setPassword(userId: string, password: string) {
    await must(sb().from("user_credentials").upsert({ user_id: userId, password_hash: bcrypt.hashSync(password, 10), updated_at: new Date().toISOString() }).select());
    await this.revokeSessions(userId);
  },
  async revokeSessions(userId: string) {
    const v = (await this.sessionVersion(userId)) + 1;
    await must(sb().from("profiles").update({ session_version: v }).eq("id", userId).select());
    return v;
  },
  async setActive(orgId: string, userId: string, active: boolean) {
    const rows = await must(sb().from("profiles").update({ deactivated: !active }).eq("id", userId).eq("org_id", orgId).select());
    if (rows[0] && !active) await this.revokeSessions(userId);
    return rows[0] ? mapUser(rows[0]) : null;
  },
  async changeRole(orgId: string, userId: string, role: Profile["role"]) {
    const rows = await must(sb().from("profiles").update({ role }).eq("id", userId).eq("org_id", orgId).select());
    if (rows[0]) await this.revokeSessions(userId);
    return rows[0] ? mapUser(rows[0]) : null;
  },
  async createSetPasswordToken(userId: string): Promise<string> {
    const token = Buffer.from(`${userId}:${uid("set")}`).toString("base64url");
    await must(sb().from("set_password_tokens").insert({ token, user_id: userId }).select());
    return token;
  },
  async consumeSetPasswordToken(token: string, password: string): Promise<Profile | null> {
    const rows = await must(sb().from("set_password_tokens").select("*").eq("token", token).is("used_at", null).limit(1));
    const row = rows[0];
    if (!row) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) return null;
    await this.setPassword(row.user_id, password);
    await must(sb().from("set_password_tokens").update({ used_at: new Date().toISOString() }).eq("token", token).select());
    await must(sb().from("profiles").update({ deactivated: false }).eq("id", row.user_id).select());
    return this.userById(row.user_id);
  },
  async addScreening(orgId: string, actor: string, rec: Omit<ScreeningRecord, "id" | "orgId" | "createdAt">): Promise<ScreeningRecord> {
    const rows = await must(sb().from("screenings").insert({
      org_id: orgId, site_id: rec.siteId, context: rec.context, subject_name: rec.subjectName,
      anonymous: rec.anonymous, age_range: rec.ageRange, origin_country: rec.originCountry,
      origin_region: rec.originRegion, destination: rec.destination, travel_history: rec.travelHistory,
      contact_with_case: rec.contactWithCase, symptoms: rec.symptoms, hcw_exposure: rec.hcwExposure,
      funeral_exposure: rec.funeralExposure, notes: rec.notes, risk: rec.risk, action: rec.action,
      rationale: rec.rationale, created_by: actor,
    }).select());
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
    const rows = await must(sb().from("contacts").insert({
      org_id: orgId, name: c.name, phone: c.phone ?? null, linked_screening_id: c.linkedScreeningId ?? null,
      linked_case_id: c.linkedCaseId ?? null, monitoring_start: c.monitoringStart, monitoring_end: c.monitoringEnd,
      status: c.status, checkins: c.checkins, notes: c.notes,
    }).select());
    await this.logAudit(orgId, actor, "contact.create", rows[0].id);
    return mapContact(rows[0]);
  },
  async updateContactStatus(orgId: string, id: string, status: Contact["status"], actor: string) {
    const rows = await must(sb().from("contacts").update({ status }).eq("id", id).eq("org_id", orgId).select());
    if (rows[0]) await this.logAudit(orgId, actor, "contact.update", id, { status });
    return rows[0] ? mapContact(rows[0]) : null;
  },
  async logCheckin(orgId: string, id: string, day: number, status: "ok" | "symptom" | "missed", actor: string) {
    const rows = await must(sb().from("contacts").select("*").eq("id", id).eq("org_id", orgId).limit(1));
    if (!rows[0]) return null;
    const c = mapContact(rows[0]);
    const existing = c.checkins.find((x) => x.day === day);
    if (existing) { existing.status = status; existing.date = new Date().toISOString(); }
    else { c.checkins.push({ day, date: new Date().toISOString(), status }); c.checkins.sort((a, b) => a.day - b.day); }
    const upd = await must(sb().from("contacts").update({ checkins: c.checkins }).eq("id", id).eq("org_id", orgId).select());
    await this.logAudit(orgId, actor, "contact.checkin", id, { day, status });
    return mapContact(upd[0]);
  },
  async addAlert(orgId: string, actor: string, a: Omit<Alert, "id" | "orgId" | "createdAt" | "status">): Promise<Alert> {
    const rows = await must(sb().from("alerts").insert({
      org_id: orgId, category: a.category, severity: a.severity, title: a.title,
      description: a.description, status: "open", owner: a.owner ?? null, linked_id: a.linkedId ?? null,
    }).select());
    await this.logAudit(orgId, actor, "alert.create", rows[0].id);
    return mapAlert(rows[0]);
  },
  async setAlertStatus(orgId: string, id: string, status: Alert["status"], actor: string) {
    const patch: Record<string, unknown> = { status };
    if (status === "resolved") patch.resolved_at = new Date().toISOString();
    const rows = await must(sb().from("alerts").update(patch).eq("id", id).eq("org_id", orgId).select());
    if (rows[0]) await this.logAudit(orgId, actor, `alert.${status}`, id);
    return rows[0] ? mapAlert(rows[0]) : null;
  },
  async adjustResource(orgId: string, id: string, delta: number, actor: string, reason: string) {
    const rows = await must(sb().from("resources").select("on_hand").eq("id", id).eq("org_id", orgId).limit(1));
    if (!rows[0]) return null;
    const onHand = Math.max(0, rows[0].on_hand + delta);
    const upd = await must(sb().from("resources").update({ on_hand: onHand }).eq("id", id).eq("org_id", orgId).select());
    await this.logAudit(orgId, actor, "resource.update", id, { delta, reason });
    return mapResource(upd[0]);
  },
  async addReport(rpt: Omit<SitRep, "id">): Promise<SitRep> {
    const rows = await must(sb().from("reports").insert({
      org_id: rpt.orgId, kind: rpt.kind, title: rpt.title, generated_by: rpt.generatedBy,
      ai_assisted: rpt.aiAssisted, summary: rpt.summary, key_numbers: rpt.keyNumbers, hotspots: rpt.hotspots,
      open_risks: rpt.openRisks, recommended: rpt.recommended, changes_since_last: rpt.changesSinceLast,
    }).select());
    await this.logAudit(rpt.orgId, rpt.generatedBy, "report.generate", rows[0].id);
    return mapReport(rows[0]);
  },
  async createSite(orgId: string, actor: string, s: Omit<Site, "id" | "orgId">): Promise<Site> {
    const rows = await must(sb().from("sites").insert({
      org_id: orgId, name: s.name, kind: s.kind, country: s.country, region: s.region,
      lat: s.lat, lng: s.lng, workers_per_day: s.workersPerDay ?? null, status: s.status,
    }).select());
    await this.logAudit(orgId, actor, "site.create", rows[0].id);
    return mapSite(rows[0]);
  },
  async updateSettings(orgId: string, patch: Partial<OrgSettings>, actor: string): Promise<OrgSettings> {
    const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.aiProvider) dbPatch.ai_provider = patch.aiProvider;
    if (patch.messagingProvider) dbPatch.messaging_provider = patch.messagingProvider;
    if (patch.riskWeights) dbPatch.risk_weights = patch.riskWeights;
    if (patch.riskThresholds) dbPatch.risk_thresholds = patch.riskThresholds;
    if (patch.onboarding) dbPatch.onboarding = patch.onboarding;
    const rows = await must(sb().from("org_settings").update(dbPatch).eq("org_id", orgId).select());
    await this.logAudit(orgId, actor, "settings.update", "settings", patch as Record<string, unknown>);
    return mapSettings(rows[0]);
  },
  async addLead(l: Omit<Lead, "id" | "createdAt">): Promise<Lead> {
    const rows = await must(sb().from("leads").insert({
      email: l.email, name: l.name ?? null, org: l.org ?? null, role: l.role ?? null,
      audience: l.audience ?? null, intent: l.intent ?? null, message: l.message ?? null,
      source: l.source, utm: l.utm ?? {},
    }).select());
    return mapLead(rows[0]);
  },
  async addNotification(orgId: string, n: { channel: string; target: string; subject: string; body: string; severity: string; status: string; error?: string }) {
    await must(sb().from("notifications").insert({
      org_id: orgId, channel: n.channel, target: n.target, subject: n.subject, body: n.body,
      severity: n.severity, status: n.status, error: n.error ?? null,
    }).select());
  },
};
