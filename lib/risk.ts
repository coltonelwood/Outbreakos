import type { Risk, ScreeningRecord } from "./types";

// Transparent, rule-based operational risk scoring.
// This is NOT a diagnostic. It assigns an *operational triage tier* used to
// drive screening workflow actions (clear, monitor, secondary screen, isolate
// & notify health officer). All factors and weights are visible and
// explainable to the operator.

export interface RiskInput {
  symptoms: ScreeningRecord["symptoms"];
  contactWithCase: boolean;
  travelHistory: string[];
  hcwExposure: boolean;
  funeralExposure: boolean;
  originRegion: string;
}

export interface RiskOutput {
  risk: Risk;
  score: number;
  action: string;
  rationale: string[];
}

const HIGH_RISK_REGIONS = [
  "Bundibugyo",
  "Kasese",
  "North Kivu",
  "Ituri",
  "Mbandaka",
  "Bunia",
  "Equateur",
];

export function scoreScreening(input: RiskInput): RiskOutput {
  const rationale: string[] = [];
  let score = 0;

  if (input.symptoms.fever) {
    score += 25;
    rationale.push("Reported fever (+25)");
  }
  if (input.symptoms.vomitingDiarrhea) {
    score += 15;
    rationale.push("Vomiting / diarrhea (+15)");
  }
  if (input.symptoms.unexplainedBleeding) {
    score += 40;
    rationale.push("Unexplained bleeding (+40)");
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
    score += 30;
    rationale.push("Reported contact with suspected/confirmed case (+30)");
  }
  if (input.hcwExposure) {
    score += 15;
    rationale.push("Healthcare worker exposure (+15)");
  }
  if (input.funeralExposure) {
    score += 20;
    rationale.push("Funeral / burial exposure (+20)");
  }

  const travelHit = input.travelHistory.some((t) =>
    HIGH_RISK_REGIONS.some((r) => t.toLowerCase().includes(r.toLowerCase())),
  );
  if (travelHit) {
    score += 20;
    rationale.push("Travel through active outbreak region (+20)");
  }

  const originHit = HIGH_RISK_REGIONS.some((r) =>
    input.originRegion.toLowerCase().includes(r.toLowerCase()),
  );
  if (originHit && !travelHit) {
    score += 15;
    rationale.push("Origin in active outbreak region (+15)");
  }

  let risk: Risk;
  let action: string;

  if (score >= 70) {
    risk = "urgent";
    action =
      "Isolate immediately in designated area and notify the on-call health officer. Do not move subject through general flow.";
  } else if (score >= 40) {
    risk = "elevated";
    action =
      "Move to secondary screening, collect detailed history, prepare for possible referral to health authority.";
  } else if (score >= 15) {
    risk = "monitor";
    action =
      "Clear for entry; enroll in 21-day daily symptom check-in via SMS/WhatsApp.";
  } else {
    risk = "low";
    action = "Clear for entry. No further follow-up required.";
  }

  if (rationale.length === 0) {
    rationale.push("No risk factors reported.");
  }

  return { risk, score, action, rationale };
}
