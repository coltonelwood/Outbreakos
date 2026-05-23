// Provider-agnostic AI abstraction. Supports OpenAI, Anthropic (Claude), or a
// deterministic offline fallback that uses the live in-memory data so the
// product works end-to-end without any API key.

import { db } from "./store";
import type { SitRep } from "./types";
import { compactNumber } from "./utils";

export type Provider = "openai" | "anthropic" | "none";

function provider(): Provider {
  const p = (process.env.AI_PROVIDER || "none").toLowerCase();
  if (p === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (p === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "none";
}

const DISCLAIMER =
  "AI outputs are advisory only. Outbreak operations decisions require human review by qualified public-health authorities.";

const SYSTEM_PROMPT = `You are the OutbreakOS Command Assistant. You help operations leaders run an outbreak response: screening, contact monitoring, logistics, and stakeholder briefings.

Hard rules:
- NEVER diagnose disease or claim someone is infected.
- NEVER replace clinical judgment.
- Always cite which internal data you used (case counts, region IDs, site IDs).
- Append a brief disclaimer that outputs require human review.
- Be concise, structured, and operational.`;

interface AIRequest {
  user: string;
  intent?:
    | "briefing"
    | "summarize_alerts"
    | "stakeholder_update"
    | "resource_request"
    | "ministry_outreach"
    | "explain_risk"
    | "freeform";
}

interface AIResponse {
  text: string;
  citations: string[];
  disclaimer: string;
  provider: Provider;
}

function buildContext(): string {
  const d = db();
  const totals = d.regions.reduce(
    (acc, r) => ({
      confirmed: acc.confirmed + r.confirmed,
      suspected: acc.suspected + r.suspected,
      deaths: acc.deaths + r.deaths,
      contacts: acc.contacts + r.contactsMonitored,
    }),
    { confirmed: 0, suspected: 0, deaths: 0, contacts: 0 },
  );
  const openAlerts = d.alerts.filter((a) => a.status === "open").length;
  const urgentScreenings = d.screenings.filter((s) => s.risk === "urgent").length;
  return `
Current operational snapshot (${new Date().toISOString().slice(0, 10)}):
- Regions tracked: ${d.regions.map((r) => `${r.name}(${r.severity},${r.trend})`).join(", ")}
- Totals: confirmed=${totals.confirmed} suspected=${totals.suspected} deaths=${totals.deaths} contacts_monitored=${totals.contacts}
- Open alerts: ${openAlerts}
- Sites: ${d.sites.map((s) => `${s.id}=${s.name}(${s.status})`).join(", ")}
- Urgent screenings (rolling): ${urgentScreenings}
- Low-stock resources: ${d.resources
    .filter((r) => r.onHand < r.minStock)
    .map((r) => `${r.label}@${r.siteId}`)
    .join(", ") || "none"}
`;
}

async function callOpenAI(prompt: string): Promise<string> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    }),
  });
  const j = await r.json();
  return j?.choices?.[0]?.message?.content ?? "(AI returned no content.)";
}

async function callAnthropic(prompt: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const j = await r.json();
  const block = j?.content?.find?.((b: { type: string }) => b.type === "text");
  return block?.text ?? "(AI returned no content.)";
}

function deterministicResponse(req: AIRequest): string {
  const d = db();
  const ctx = buildContext();
  switch (req.intent) {
    case "briefing":
      return `Executive briefing (operational, non-diagnostic):

${ctx}

Top three operational priorities right now:
1. Hold the Bundibugyo cluster — pre-position PPE, surge isolation beds, joint UG/DRC coordination.
2. Tighten Entebbe + Mpondwe screening on Bunia-corridor inbounds.
3. Recover lost-to-follow-up contact in North Kivu and re-establish daily check-ins.

User question: "${req.user}"`;

    case "summarize_alerts":
      return `Open alerts (${d.alerts.filter((a) => a.status === "open").length} total):

${d.alerts
  .filter((a) => a.status === "open")
  .slice(0, 6)
  .map((a) => `• [${a.severity.toUpperCase()}] ${a.title} — ${a.description}`)
  .join("\n")}

Recommended owner routing:
- Health Officer: critical + high severity items
- Admin: PPE / supply alerts
- Site lead: border / point-of-entry surges`;

    case "stakeholder_update":
      return `Stakeholder update draft — ${new Date().toISOString().slice(0, 10)}

Dear partners,

We continue to coordinate the response to the Bundibugyo cross-border situation.
- Confirmed cases (tracked regions): ${d.regions.reduce((s, r) => s + r.confirmed, 0)}
- Suspected: ${d.regions.reduce((s, r) => s + r.suspected, 0)}
- Contacts under daily monitoring: ${d.regions.reduce((s, r) => s + r.contactsMonitored, 0)}
- 24h screening throughput: ${compactNumber(1842)}

Key operational actions in flight:
- Reinforced Entebbe airport screening on Bunia-corridor flights
- PPE replenishment in motion to Bundibugyo District Hospital
- Daily UG/DRC operations call requested

We will issue a next update within 24 hours.`;

    case "resource_request":
      return `Resource request memo

To: Procurement / Logistics
Subject: Emergency replenishment — Bundibugyo District Hospital

Based on current burn rate (PPE 8 kits/day, sample kits 6/day) and on-hand
inventory we project 4 days of cover. Requested:
- 120 Tier-3 PPE kits
- 200 disposable gowns
- 60 sample collection kits
- 1 mobile cold-chain unit

Recommended delivery within 48 hours via UNHRD pre-positioned stock.`;

    case "ministry_outreach":
      return `Draft outreach — Ministry of Health liaison

Subject: Coordination request — Bundibugyo cross-border response

Greetings,

OutbreakOS-supported field teams have observed a rising trend in the
Bundibugyo cluster, with parallel signal in Ituri (DRC). We respectfully
request a joint daily coordination call to align on:
1. Cross-border traveler screening protocols (Entebbe, Mpondwe, Bunia)
2. Contact tracing data sharing
3. PPE pre-positioning windows

We can host or join a 30-minute call at the Ministry's convenience.`;

    case "explain_risk":
      return `How operational risk tiers are determined (transparent):

Factors and weights:
- Reported fever: +25
- Vomiting / diarrhea: +15
- Unexplained bleeding: +40
- Reported contact with suspected/confirmed case: +30
- Healthcare worker exposure: +15
- Funeral / burial exposure: +20
- Travel through active outbreak region: +20
- Origin in active outbreak region: +15

Thresholds:
- 0-14   → low (clear for entry)
- 15-39  → monitor (21-day SMS check-in)
- 40-69  → elevated (secondary screening)
- 70+    → urgent (isolate; notify health officer)

This is an operational triage tier, NOT a medical diagnosis.`;

    default:
      return `Operational response to: "${req.user}"

${ctx}

Suggested next actions (human review required):
1. Review open alerts in the Alerts Center.
2. Confirm contact monitoring coverage in active regions.
3. Verify PPE / sample kit stock at Bundibugyo District Hospital.
4. Generate today's SITREP and route to leadership.`;
  }
}

export async function aiCommand(req: AIRequest): Promise<AIResponse> {
  const p = provider();
  const ctx = buildContext();
  const fullPrompt = `${ctx}\n\nUser request (intent=${req.intent || "freeform"}):\n${req.user}`;

  const citations: string[] = [];
  const d = db();
  d.regions.forEach((r) => citations.push(`region:${r.id}`));
  d.sites.forEach((s) => citations.push(`site:${s.id}`));

  let text: string;
  try {
    if (p === "openai") text = await callOpenAI(fullPrompt);
    else if (p === "anthropic") text = await callAnthropic(fullPrompt);
    else text = deterministicResponse(req);
  } catch (e) {
    text =
      deterministicResponse(req) +
      `\n\n(Note: live AI provider call failed, using deterministic fallback.)`;
  }

  return { text, citations: citations.slice(0, 12), disclaimer: DISCLAIMER, provider: p };
}

export function buildSitRep(kind: SitRep["kind"], actor: string): SitRep {
  const d = db();
  const totals = d.regions.reduce(
    (acc, r) => ({
      confirmed: acc.confirmed + r.confirmed,
      suspected: acc.suspected + r.suspected,
      deaths: acc.deaths + r.deaths,
      contacts: acc.contacts + r.contactsMonitored,
    }),
    { confirmed: 0, suspected: 0, deaths: 0, contacts: 0 },
  );
  const screened24 = d.screenings.length;
  const urgent24 = d.screenings.filter((s) => s.risk === "urgent").length;

  const titleMap: Record<SitRep["kind"], string> = {
    daily_sitrep: "Daily SITREP",
    exec_briefing: "Executive Briefing",
    airport_screening: "Airport Screening Report",
    mining_workforce: "Mining Site Workforce Report",
    ngo_donor: "NGO Donor Report",
  };

  return {
    id: "",
    orgId: d.org.id,
    kind,
    title: `${titleMap[kind]} — ${new Date().toISOString().slice(0, 10)}`,
    generatedAt: new Date().toISOString(),
    generatedBy: actor,
    aiAssisted: provider() !== "none",
    summary:
      kind === "ngo_donor"
        ? `Field response remains active across ${d.regions.length} regions. Donor-funded contact monitoring is reaching ${totals.contacts} individuals daily. PPE replenishment in motion to high-burn sites.`
        : `Operational picture: ${totals.confirmed} confirmed, ${totals.suspected} suspected across ${d.regions.length} regions. ${totals.contacts} contacts under daily monitoring. ${urgent24} urgent screenings in window. PPE burn rate flagged at Bundibugyo District Hospital.`,
    keyNumbers: [
      { label: "Confirmed", value: String(totals.confirmed), delta: "+3 (48h)" },
      { label: "Suspected", value: String(totals.suspected), delta: "+6 (48h)" },
      { label: "Deaths", value: String(totals.deaths) },
      { label: "Contacts monitored", value: String(totals.contacts), delta: "+18" },
      { label: "Screenings (window)", value: String(screened24) },
      { label: "Urgent screenings", value: String(urgent24) },
    ],
    hotspots: d.regions
      .filter((r) => r.trend === "rising" || r.severity === "high")
      .map((r) => `${r.name} (${r.country}) — ${r.trend}`),
    openRisks: d.alerts
      .filter((a) => a.status === "open" && (a.severity === "high" || a.severity === "critical"))
      .map((a) => a.title),
    recommended: [
      "Pre-position 80 PPE kits to Bundibugyo within 48h",
      "Activate secondary screening lane at Mpondwe border",
      "Recover lost-to-follow-up contact in North Kivu",
      "Initiate joint UG/DRC daily coordination call",
    ],
    changesSinceLast: [
      "New suspected cases in Bundibugyo",
      "Two contacts cleared from 21-day window",
      "Lab samples in transit for case_004 cohort",
    ],
  };
}
