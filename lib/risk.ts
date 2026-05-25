import type { OrgSettings, Risk, ScreeningRecord } from "./types";

// Operational triage tiering — NOT a clinical diagnosis. The output is an
// escalation priority used to drive the screening workflow:
//   low      → clear
//   monitor  → enroll in daily symptom check-in
//   elevated → secondary screening + history
//   urgent   → isolate and notify health officer
//
// Factors and weights are transparent and configurable per-org so customers
// can tune the platform to their site protocols.

export interface RiskInput {
  symptoms: ScreeningRecord["symptoms"];
  contactWithCase: boolean;
  travelHistory: string[];
  hcwExposure: boolean;
  funeralExposure: boolean;
  originRegion: string;
  highRiskRegions?: string[];
}

export interface RiskOutput {
  tier: Risk;
  score: number;
  action: string;
  rationale: string[];
}

const DEFAULT_HIGH_RISK_REGIONS = [
  "Bundibugyo",
  "Kasese",
  "North Kivu",
  "Ituri",
  "Mbandaka",
  "Bunia",
  "Equateur",
];

const ACTIONS: Record<Risk, string> = {
  low: "Clear for entry. No further follow-up required.",
  monitor:
    "Clear for entry. Enroll in 21-day daily symptom check-in via configured messaging channel.",
  elevated:
    "Move to secondary screening: take detailed history and prepare for possible referral to the on-call health authority.",
  urgent:
    "Move subject to the designated isolation area and notify the on-call health officer. Do not progress through general flow.",
};

export function scoreScreening(
  input: RiskInput,
  weights: OrgSettings["riskWeights"] = {
    fever: 25,
    bleeding: 40,
    contact: 30,
    travel: 20,
    hcw: 15,
    funeral: 20,
  },
  thresholds: { monitor: number; elevated: number; urgent: number } = {
    monitor: 15,
    elevated: 40,
    urgent: 70,
  },
): RiskOutput {
  const rationale: string[] = [];
  let score = 0;
  const regions = input.highRiskRegions ?? DEFAULT_HIGH_RISK_REGIONS;

  if (input.symptoms.fever) {
    score += weights.fever;
    rationale.push(`Reported fever (+${weights.fever})`);
  }
  if (input.symptoms.vomitingDiarrhea) {
    score += 15;
    rationale.push("Vomiting / diarrhea (+15)");
  }
  if (input.symptoms.unexplainedBleeding) {
    score += weights.bleeding;
    rationale.push(`Unexplained bleeding (+${weights.bleeding})`);
  }
  if (input.symptoms.fatigue) {
    score += 5;
    rationale.push("Fatigue (+5)");
  }
  if (input.symptoms.headache) {
    score += 5;
    rationale.push("Headache (+5)");
  }
  if (input.contactWithCase) {
    score += weights.contact;
    rationale.push(`Contact with suspected/confirmed case (+${weights.contact})`);
  }
  if (input.hcwExposure) {
    score += weights.hcw;
    rationale.push(`Healthcare worker exposure (+${weights.hcw})`);
  }
  if (input.funeralExposure) {
    score += weights.funeral;
    rationale.push(`Funeral / burial exposure (+${weights.funeral})`);
  }

  const travelHit = input.travelHistory.some((t) =>
    regions.some((r) => t.toLowerCase().includes(r.toLowerCase())),
  );
  if (travelHit) {
    score += weights.travel;
    rationale.push(`Travel through active surveillance region (+${weights.travel})`);
  }
  const originHit = regions.some((r) =>
    input.originRegion.toLowerCase().includes(r.toLowerCase()),
  );
  if (originHit && !travelHit) {
    score += 15;
    rationale.push("Origin in active surveillance region (+15)");
  }

  let tier: Risk;
  if (score >= thresholds.urgent) tier = "urgent";
  else if (score >= thresholds.elevated) tier = "elevated";
  else if (score >= thresholds.monitor) tier = "monitor";
  else tier = "low";

  if (rationale.length === 0) rationale.push("No operational risk factors reported.");

  return { tier, score, action: ACTIONS[tier], rationale };
}
