// Provider-agnostic AI abstraction with caching, structured output, and a
// real (tenant-aware) deterministic fallback so the product works end-to-end
// without any API key — but is never tied to one demo narrative.

import { withCache } from "./cache";
import { data } from "./store";
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
  "AI outputs are advisory only. Operational and clinical decisions require human review by qualified authorities. Not a medical diagnosis.";

const SYSTEM_PROMPT = `You are the OutbreakOS Command Assistant. You help operations leaders run health-security workflows: screening, contact monitoring, logistics, and stakeholder briefings for high-risk workforces.

Hard rules:
- NEVER diagnose disease or claim someone is infected.
- NEVER replace clinical judgment.
- Always reference the specific internal data you used (region IDs, site IDs, screening IDs).
- Append a brief disclaimer that outputs require human review.
- Be concise, structured, and operational.`;

interface AIRequest {
  orgId: string;
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

export interface AIResponse {
  text: string;
  citations: string[];
  disclaimer: string;
  provider: Provider;
  cached: boolean;
  generatedAt: string;
}

function snapshot(orgId: string) {
  const regions = data.regions(orgId);
  const sites = data.sites(orgId);
  const alerts = data.alerts(orgId);
  const screenings = data.screenings(orgId);
  const resources = data.resources(orgId);
  const totals = regions.reduce(
    (acc, r) => ({
      confirmed: acc.confirmed + r.confirmed,
      suspected: acc.suspected + r.suspected,
      deaths: acc.deaths + r.deaths,
      contacts: acc.contacts + r.contactsMonitored,
    }),
    { confirmed: 0, suspected: 0, deaths: 0, contacts: 0 },
  );
  return { regions, sites, alerts, screenings, resources, totals };
}

function buildContext(orgId: string): string {
  const s = snapshot(orgId);
  return `Organization snapshot (${new Date().toISOString().slice(0, 10)}):
- Regions tracked: ${s.regions.map((r) => `${r.name}[${r.id}](${r.severity},${r.trend})`).join(", ") || "(none yet)"}
- Totals: confirmed=${s.totals.confirmed} suspected=${s.totals.suspected} deaths=${s.totals.deaths} contacts_monitored=${s.totals.contacts}
- Open alerts: ${s.alerts.filter((a) => a.status === "open").length}
- Sites: ${s.sites.map((x) => `${x.id}=${x.name}(${x.status})`).join(", ") || "(none yet)"}
- Urgent screenings (window): ${s.screenings.filter((x) => x.risk === "urgent").length}
- Low-stock resources: ${s.resources.filter((r) => r.onHand < r.minStock).map((r) => `${r.label}@${r.siteId}`).join(", ") || "none"}
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

function deterministicResponse(req: AIRequest): { text: string; citations: string[] } {
  const s = snapshot(req.orgId);
  const cites: string[] = [];
  const refRegions = s.regions.slice(0, 5).map((r) => {
    cites.push(`region:${r.id}`);
    return `${r.name} (${r.country}, ${r.severity}, ${r.trend})`;
  });
  const refSites = s.sites.slice(0, 5).map((x) => {
    cites.push(`site:${x.id}`);
    return `${x.name} [${x.id}]`;
  });
  const openAlerts = s.alerts.filter((a) => a.status === "open");
  openAlerts.slice(0, 4).forEach((a) => cites.push(`alert:${a.id}`));
  const lowStock = s.resources.filter((r) => r.onHand < r.minStock);

  const topRisks = openAlerts
    .filter((a) => a.severity === "critical" || a.severity === "high")
    .slice(0, 5)
    .map((a) => `• [${a.severity.toUpperCase()}] ${a.title}`);

  switch (req.intent) {
    case "briefing": {
      const text = `Operational briefing — ${new Date().toISOString().slice(0, 10)}

State of play
- ${s.regions.length} region(s) tracked: ${refRegions.join("; ") || "(none yet)"}
- Totals: ${s.totals.confirmed} confirmed, ${s.totals.suspected} suspected, ${s.totals.deaths} deaths, ${s.totals.contacts} contacts under monitoring
- Sites in command: ${refSites.join("; ") || "(none yet)"}

Top operational priorities (next 24h)
${topRisks.length ? topRisks.join("\n") : "• No critical alerts open. Continue routine surveillance."}

${lowStock.length ? `Logistics flags
${lowStock.slice(0, 3).map((r) => `• ${r.label} at ${r.siteId}: ${r.onHand}/${r.minStock} ${r.unit} on hand`).join("\n")}` : ""}

Asked: "${req.user}"`;
      return { text, citations: cites };
    }
    case "summarize_alerts": {
      const text = `Open alerts (${openAlerts.length} total)

${openAlerts.slice(0, 6).map((a) => `• [${a.severity.toUpperCase()}] ${a.title} — ${a.description}`).join("\n") || "• None."}

Recommended ownership routing
- Health Officer: critical / high severity items
- Admin: PPE / supply alerts
- Site lead: border / point-of-entry surges`;
      return { text, citations: cites };
    }
    case "stakeholder_update": {
      const text = `Stakeholder update — ${new Date().toISOString().slice(0, 10)}

Dear partners,

Operational summary across ${s.regions.length} region(s) under coordination:
- Confirmed cases: ${s.totals.confirmed}
- Suspected cases: ${s.totals.suspected}
- Contacts on daily monitoring: ${s.totals.contacts}
- 24-hour screening throughput: ${compactNumber(s.screenings.length)}

Active operational priorities:
${topRisks.length ? topRisks.join("\n") : "• Routine surveillance, no critical escalations open."}

We will issue the next update within 24 hours.`;
      return { text, citations: cites };
    }
    case "resource_request": {
      const items = lowStock.slice(0, 6);
      const text = `Resource request memo

To: Procurement / Logistics
Subject: Replenishment request

${items.length ? `Based on current burn rate and on-hand inventory, replenishment is requested for the following:

${items.map((r) => `• ${r.label} — current ${r.onHand} ${r.unit} (minimum ${r.minStock}); days of cover ${r.burnRatePerDay > 0 ? Math.floor(r.onHand / r.burnRatePerDay) : "—"}`).join("\n")}

Recommended delivery window: 48 hours.` : "Inventory above minimum thresholds across all tracked items. No replenishment required at this time."}`;
      return { text, citations: items.map((r) => `resource:${r.id}`) };
    }
    case "ministry_outreach": {
      const text = `Draft outreach — Ministry / partner liaison

Subject: Coordination request — ${s.regions[0]?.name ?? "operational area"}

Greetings,

OutbreakOS-supported field teams are coordinating across ${s.regions.length} active region(s). We respectfully request alignment on:
1. Cross-border / cross-site screening protocols
2. Contact tracing data sharing
3. Resource pre-positioning windows

We can host or join a 30-minute call at your convenience.`;
      return { text, citations: cites };
    }
    case "explain_risk":
      return {
        text: `How operational risk tiers are determined (transparent and configurable)

The screener form collects exposures and symptoms. Each factor contributes a weighted score; thresholds map score to tier:

Factors (default weights — editable in Settings):
- Reported fever: +25
- Vomiting / diarrhea: +15
- Unexplained bleeding: +40
- Contact with suspected/confirmed case: +30
- Healthcare worker exposure: +15
- Funeral / burial exposure: +20
- Travel through active surveillance region: +20
- Origin in active surveillance region: +15 (when not already credited via travel)

Thresholds (default — editable in Settings):
- 0–14   → low (clear for entry)
- 15–39  → monitor (21-day daily symptom check-in)
- 40–69  → elevated (secondary screening)
- 70+    → urgent (isolate; notify health officer)

This is an operational triage tier driving workflow, NOT a clinical diagnosis. All thresholds and weights are visible to the operator and recorded in the audit log when changed.`,
        citations: ["settings:risk_weights"],
      };
    default: {
      const text = `Operational response to: "${req.user}"

${buildContext(req.orgId)}

Suggested next operational steps (human review required):
1. Review open alerts in the Alerts Center.
2. Confirm contact monitoring coverage in active regions.
3. Verify resource cover at sites approaching threshold.
4. Generate today's SITREP and route to leadership.`;
      return { text, citations: cites };
    }
  }
}

export async function aiCommand(req: AIRequest): Promise<AIResponse> {
  const p = provider();
  const fullPrompt = `${buildContext(req.orgId)}\n\nUser request (intent=${req.intent || "freeform"}):\n${req.user}`;
  let text: string;
  let citations: string[];
  try {
    if (p === "openai") {
      text = await callOpenAI(fullPrompt);
      const det = deterministicResponse(req);
      citations = det.citations;
    } else if (p === "anthropic") {
      text = await callAnthropic(fullPrompt);
      const det = deterministicResponse(req);
      citations = det.citations;
    } else {
      const det = deterministicResponse(req);
      text = det.text;
      citations = det.citations;
    }
  } catch {
    const det = deterministicResponse(req);
    text = det.text + "\n\n(Note: live AI provider call failed, using deterministic fallback.)";
    citations = det.citations;
  }
  return {
    text,
    citations: citations.slice(0, 12),
    disclaimer: DISCLAIMER,
    provider: p,
    cached: false,
    generatedAt: new Date().toISOString(),
  };
}

// Cached version used by the dashboard so the AI is not invoked on every
// page load. Cache key includes orgId so each tenant gets a fresh briefing.
export async function aiBriefingCached(orgId: string, ttlSec = 300): Promise<AIResponse> {
  return withCache(`ai:briefing:${orgId}`, ttlSec, async () => {
    const r = await aiCommand({
      orgId,
      intent: "briefing",
      user: "Generate a short, executive-grade operational briefing for the dashboard.",
    });
    return { ...r, cached: false };
  }).then((r) => ({ ...r, cached: true }));
}

export function buildSitRep(
  orgId: string,
  kind: SitRep["kind"],
  actor: string,
): Omit<SitRep, "id"> {
  const s = snapshot(orgId);
  const screened = s.screenings.length;
  const urgent = s.screenings.filter((x) => x.risk === "urgent").length;
  const elevated = s.screenings.filter((x) => x.risk === "elevated").length;

  const titleMap: Record<SitRep["kind"], string> = {
    daily_sitrep: "Daily Operational SITREP",
    exec_briefing: "Executive Briefing",
    airport_screening: "Point-of-Entry Screening Report",
    mining_workforce: "Mining Workforce Report",
    ngo_donor: "Donor / Partner Report",
  };

  // Differentiated templates per kind — not the same boilerplate.
  let summary: string;
  let keyNumbers: { label: string; value: string; delta?: string }[];
  let recommended: string[];

  switch (kind) {
    case "exec_briefing":
      summary = `Executive snapshot: ${s.regions.length} active region(s), ${s.totals.confirmed} confirmed and ${s.totals.suspected} suspected operationally tracked, ${s.totals.contacts} contacts under daily monitoring. ${s.alerts.filter((a) => a.status === "open" && (a.severity === "critical" || a.severity === "high")).length} high-severity items open. Continuity posture: ${s.sites.filter((x) => x.status === "lockdown").length === 0 ? "all sites operational" : "lockdowns in effect — see Sites"}.`;
      keyNumbers = [
        { label: "Active sites", value: String(s.sites.length) },
        { label: "Open critical alerts", value: String(s.alerts.filter((a) => a.status === "open" && a.severity === "critical").length) },
        { label: "Contacts monitored", value: String(s.totals.contacts) },
        { label: "Urgent screenings (window)", value: String(urgent) },
      ];
      recommended = [
        "Re-confirm continuity-of-operations stance per site",
        "Sign off on next 24h coordination cadence",
        "Approve any pre-positioning of resources flagged as low-stock",
      ];
      break;
    case "airport_screening":
      summary = `Point-of-entry screening summary. ${screened} screenings recorded in window. Cleared majority; ${elevated} elevated and ${urgent} urgent escalations handled through the isolation pathway.`;
      keyNumbers = [
        { label: "Screenings (window)", value: String(screened) },
        { label: "Urgent", value: String(urgent) },
        { label: "Elevated", value: String(elevated) },
        { label: "Sites — airports/borders", value: String(s.sites.filter((x) => x.kind === "airport" || x.kind === "border").length) },
      ];
      recommended = [
        "Add secondary screener to highest-volume gate on inbound surge windows",
        "Pre-brief ground crew on isolation pathway and PPE",
      ];
      break;
    case "mining_workforce":
      summary = `Workforce health-security report. ${s.sites.filter((x) => x.kind === "mine").length} mining site(s) under command. ${screened} worker screenings recorded; rotation health log current.`;
      keyNumbers = [
        { label: "Mining sites", value: String(s.sites.filter((x) => x.kind === "mine").length) },
        { label: "Worker screenings", value: String(screened) },
        { label: "Active contacts", value: String(data.contacts(orgId).filter((c) => c.status === "active").length) },
      ];
      recommended = [
        "Verify rotation manifests align with site entry screenings",
        "Confirm site-medic PPE replenishment within 48h",
        "Brief site general managers on continuity posture",
      ];
      break;
    case "ngo_donor":
      summary = `Donor / partner reach report. Field response active across ${s.regions.length} region(s). ${s.totals.contacts} individuals reached through daily contact monitoring; ${screened} screenings recorded in window.`;
      keyNumbers = [
        { label: "Regions reached", value: String(s.regions.length) },
        { label: "Individuals monitored", value: String(s.totals.contacts) },
        { label: "Screenings (window)", value: String(screened) },
      ];
      recommended = [
        "Share reach metrics with funding partners",
        "Schedule next quarterly accountability call",
      ];
      break;
    case "daily_sitrep":
    default:
      summary = `Daily operational picture: ${s.totals.confirmed} confirmed, ${s.totals.suspected} suspected across ${s.regions.length} region(s). ${s.totals.contacts} contacts under daily monitoring. ${urgent} urgent screening escalation(s) in window. ${s.alerts.filter((a) => a.status === "open").length} alert(s) open.`;
      keyNumbers = [
        { label: "Confirmed", value: String(s.totals.confirmed) },
        { label: "Suspected", value: String(s.totals.suspected) },
        { label: "Deaths", value: String(s.totals.deaths) },
        { label: "Contacts monitored", value: String(s.totals.contacts) },
        { label: "Screenings (window)", value: String(screened) },
        { label: "Urgent screenings", value: String(urgent) },
      ];
      recommended = [
        "Pre-position resources to lowest-cover site",
        "Reinforce surveillance at highest-throughput point of entry",
        "Recover any contacts lost to follow-up",
      ];
  }

  const hotspots = s.regions
    .filter((r) => r.trend === "rising" || r.severity === "high" || r.severity === "critical")
    .map((r) => `${r.name} (${r.country}) — ${r.trend}`);
  const openRisks = s.alerts
    .filter((a) => a.status === "open" && (a.severity === "high" || a.severity === "critical"))
    .map((a) => a.title);
  const changesSinceLast = [
    `${screened} new screenings recorded`,
    `${data.contacts(orgId).filter((c) => c.status === "cleared").length} contact(s) cleared`,
    `${s.alerts.filter((a) => a.status === "resolved").length} alert(s) resolved`,
  ];

  return {
    orgId,
    kind,
    title: `${titleMap[kind]} — ${new Date().toISOString().slice(0, 10)}`,
    generatedAt: new Date().toISOString(),
    generatedBy: actor,
    aiAssisted: provider() !== "none",
    summary,
    keyNumbers,
    hotspots,
    openRisks,
    recommended,
    changesSinceLast,
  };
}
