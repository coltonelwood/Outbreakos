// Server-side in-memory store. Acts as the demo data backend and mirrors the
// shape of the Supabase tables defined in /supabase/schema.sql.
//
// In production, swap this module's exports for Supabase client calls; the
// rest of the app uses the store interface and is unchanged.

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

interface Db {
  org: Organization;
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
  settings: OrgSettings;
}

// HMR-safe singleton.
const g = globalThis as unknown as { __outbreakos_db?: Db };

function freshDb(): Db {
  return {
    org: structuredClone(DEMO_ORG),
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
    settings: structuredClone(DEMO_SETTINGS),
  };
}

if (!g.__outbreakos_db) {
  g.__outbreakos_db = freshDb();
}

export function db(): Db {
  return g.__outbreakos_db!;
}

export function resetDb() {
  g.__outbreakos_db = freshDb();
}

export function logAudit(
  actor: string,
  action: string,
  target: string,
  meta?: Record<string, unknown>,
) {
  const entry: AuditEvent = {
    id: uid("a"),
    orgId: db().org.id,
    actor,
    action,
    target,
    meta,
    createdAt: new Date().toISOString(),
  };
  db().audit.unshift(entry);
  return entry;
}

export function addScreening(rec: Omit<ScreeningRecord, "id" | "orgId" | "createdAt">) {
  const full: ScreeningRecord = {
    id: uid("scr"),
    orgId: db().org.id,
    createdAt: new Date().toISOString(),
    ...rec,
  };
  db().screenings.unshift(full);
  logAudit(rec.createdBy, "screening.create", full.id);

  if (full.risk === "urgent" || full.risk === "elevated") {
    const alert: Alert = {
      id: uid("al"),
      orgId: db().org.id,
      category: "high_risk_screening",
      severity: full.risk === "urgent" ? "critical" : "high",
      title:
        full.risk === "urgent"
          ? `Urgent escalation — ${full.subjectName}`
          : `Elevated risk — ${full.subjectName}`,
      description: `${full.context.replace("_", " ")} screening at site ${full.siteId} produced ${full.risk} risk. Action: ${full.action}`,
      status: "open",
      linkedId: full.id,
      createdAt: new Date().toISOString(),
    };
    db().alerts.unshift(alert);
    logAudit("system", "alert.create", alert.id, { from: full.id });
  }

  if (full.risk === "monitor" || full.risk === "elevated" || full.risk === "urgent") {
    const c: Contact = {
      id: uid("ct"),
      orgId: db().org.id,
      name: `Contact-${full.subjectName.slice(0, 12)}`,
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

export function addContact(c: Omit<Contact, "id" | "orgId">) {
  const full: Contact = { id: uid("ct"), orgId: db().org.id, ...c };
  db().contacts.unshift(full);
  logAudit("system", "contact.create", full.id);
  return full;
}

export function updateContactStatus(
  id: string,
  status: Contact["status"],
  actor: string,
) {
  const c = db().contacts.find((x) => x.id === id);
  if (!c) return null;
  c.status = status;
  logAudit(actor, "contact.update", id, { status });
  return c;
}

export function addAlert(a: Omit<Alert, "id" | "orgId" | "createdAt" | "status">) {
  const full: Alert = {
    id: uid("al"),
    orgId: db().org.id,
    createdAt: new Date().toISOString(),
    status: "open",
    ...a,
  };
  db().alerts.unshift(full);
  logAudit("system", "alert.create", full.id);
  return full;
}

export function setAlertStatus(id: string, status: Alert["status"], actor: string) {
  const a = db().alerts.find((x) => x.id === id);
  if (!a) return null;
  a.status = status;
  if (status === "resolved") a.resolvedAt = new Date().toISOString();
  logAudit(actor, `alert.${status}`, id);
  return a;
}

export function adjustResource(id: string, delta: number, actor: string) {
  const r = db().resources.find((x) => x.id === id);
  if (!r) return null;
  r.onHand = Math.max(0, r.onHand + delta);
  logAudit(actor, "resource.update", id, { delta });
  return r;
}

export function addReport(rpt: SitRep | Omit<SitRep, "id" | "orgId">) {
  const full: SitRep = { ...(rpt as SitRep), id: uid("rpt"), orgId: db().org.id };
  db().reports.unshift(full);
  logAudit(full.generatedBy, "report.generate", full.id);
  return full;
}
