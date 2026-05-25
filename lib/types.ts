// OutbreakOS core domain types.
// These mirror the Supabase schema in /supabase/schema.sql so the demo
// in-memory store is type-compatible with a real database backend.

export type Role = "owner" | "admin" | "health_officer" | "screener" | "viewer";
export type Severity = "info" | "warning" | "high" | "critical";
export type Risk = "low" | "monitor" | "elevated" | "urgent";
export type ScreeningContext = "airport" | "site_entry" | "clinic";
export type AlertCategory =
  | "high_risk_screening"
  | "missed_checkin"
  | "cluster_increase"
  | "ppe_low_stock"
  | "border_risk"
  | "lab_pending"
  | "manual";
export type AlertStatus = "open" | "ack" | "resolved";
export type ContactStatus =
  | "active"
  | "cleared"
  | "escalated"
  | "lost_to_follow_up";
export type ReportKind =
  | "daily_sitrep"
  | "exec_briefing"
  | "airport_screening"
  | "mining_workforce"
  | "ngo_donor";
export type OpsMode =
  | "standard"
  | "mining_site"
  | "airport_poe"
  | "gov_emergency"
  | "ngo_field";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  mode: OpsMode;
  branding: { primary: string; logoText: string };
  createdAt: string;
}

export interface Profile {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: Role;
  siteId?: string;
  createdAt: string;
}

export interface Site {
  id: string;
  orgId: string;
  name: string;
  kind: "airport" | "mine" | "hospital" | "clinic" | "border" | "field_base";
  country: string;
  region: string;
  lat: number;
  lng: number;
  workersPerDay?: number;
  status: "active" | "monitoring" | "lockdown";
}

export interface OutbreakRegion {
  id: string;
  orgId: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  radiusKm: number;
  confirmed: number;
  suspected: number;
  deaths: number;
  contactsMonitored: number;
  severity: Severity;
  trend: "rising" | "stable" | "declining";
  updatedAt: string;
}

export interface ScreeningRecord {
  id: string;
  orgId: string;
  siteId: string;
  context: ScreeningContext;
  subjectName: string;
  anonymous: boolean;
  ageRange: "0-17" | "18-39" | "40-59" | "60+";
  originCountry: string;
  originRegion: string;
  destination: string;
  travelHistory: string[];
  contactWithCase: boolean;
  symptoms: {
    fever: boolean;
    vomitingDiarrhea: boolean;
    unexplainedBleeding: boolean;
    fatigue: boolean;
    headache: boolean;
  };
  hcwExposure: boolean;
  funeralExposure: boolean;
  notes: string;
  risk: Risk;
  action: string;
  rationale: string[];
  createdAt: string;
  createdBy: string;
}

export interface Contact {
  id: string;
  orgId: string;
  name: string;
  phone?: string;
  linkedScreeningId?: string;
  linkedCaseId?: string;
  monitoringStart: string;
  monitoringEnd: string;
  status: ContactStatus;
  checkins: { day: number; date: string; status: "ok" | "symptom" | "missed" }[];
  notes: string;
}

export interface CaseRecord {
  id: string;
  orgId: string;
  classification: "suspected" | "probable" | "confirmed";
  outcome: "monitoring" | "recovered" | "deceased";
  regionId: string;
  reportedAt: string;
  notes: string;
}

export interface Alert {
  id: string;
  orgId: string;
  category: AlertCategory;
  severity: Severity;
  title: string;
  description: string;
  status: AlertStatus;
  owner?: string;
  linkedId?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ResourceItem {
  id: string;
  orgId: string;
  siteId: string;
  category:
    | "ppe_kit"
    | "gloves"
    | "gowns"
    | "masks"
    | "sample_kits"
    | "disinfectant"
    | "beds"
    | "staff"
    | "vehicles";
  label: string;
  onHand: number;
  minStock: number;
  burnRatePerDay: number;
  unit: string;
}

export interface SitRep {
  id: string;
  orgId: string;
  kind: ReportKind;
  title: string;
  generatedAt: string;
  generatedBy: string;
  aiAssisted: boolean;
  summary: string;
  keyNumbers: { label: string; value: string; delta?: string }[];
  hotspots: string[];
  openRisks: string[];
  recommended: string[];
  changesSinceLast: string[];
}

export interface AuditEvent {
  id: string;
  orgId: string;
  actor: string;
  action: string;
  target: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface OrgSettings {
  orgId: string;
  aiProvider: "openai" | "anthropic" | "none";
  messagingProvider: "twilio" | "whatsapp" | "none";
  riskWeights: {
    fever: number;
    bleeding: number;
    contact: number;
    travel: number;
    hcw: number;
    funeral: number;
  };
  riskThresholds: { monitor: number; elevated: number; urgent: number };
  apiKeysMasked: { name: string; lastFour: string }[];
  onboarding: {
    dismissed: boolean;
    completedSteps: string[];
  };
}
