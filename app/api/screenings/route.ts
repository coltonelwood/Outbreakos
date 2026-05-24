import { NextResponse } from "next/server";
import { z } from "zod";
import { addScreening, data } from "@/lib/store";
import { scoreScreening } from "@/lib/risk";
import { authErrorResponse, requireCapability } from "@/lib/auth";
import { clientKey, rateLimitAsync, rateLimitResponse } from "@/lib/ratelimit";
import { notifyEvent } from "@/lib/notify";

const schema = z.object({
  context: z.enum(["airport", "site_entry", "clinic"]),
  siteId: z.string(),
  subjectName: z.string().optional(),
  anonymous: z.boolean(),
  ageRange: z.enum(["0-17", "18-39", "40-59", "60+"]),
  originCountry: z.string().min(1).max(80),
  originRegion: z.string().max(120),
  destination: z.string().max(120),
  travelHistory: z.string().max(500).optional(),
  contactWithCase: z.boolean(),
  fever: z.boolean(),
  vomitingDiarrhea: z.boolean(),
  unexplainedBleeding: z.boolean(),
  fatigue: z.boolean(),
  headache: z.boolean(),
  hcwExposure: z.boolean(),
  funeralExposure: z.boolean(),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  let sess;
  try {
    sess = requireCapability("screening.create");
  } catch (e) {
    return authErrorResponse(e);
  }
  const limit = await rateLimitAsync(clientKey(req, `scr:${sess.orgId}`), { limit: 60, windowSec: 60 });
  if (!limit.ok) return rateLimitResponse(limit);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const v = parsed.data;
  const symptoms = {
    fever: v.fever,
    vomitingDiarrhea: v.vomitingDiarrhea,
    unexplainedBleeding: v.unexplainedBleeding,
    fatigue: v.fatigue,
    headache: v.headache,
  };
  const travelHistory = (v.travelHistory || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // Use org-configured weights AND thresholds.
  const settings = await data.settings(sess.orgId);
  const scored = scoreScreening(
    {
      symptoms,
      contactWithCase: v.contactWithCase,
      travelHistory,
      hcwExposure: v.hcwExposure,
      funeralExposure: v.funeralExposure,
      originRegion: v.originRegion,
    },
    settings.riskWeights,
    settings.riskThresholds,
  );

  const subjectName =
    v.subjectName?.trim() ||
    `Anon-${(v.siteId || "X").slice(-3).toUpperCase()}-${Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0")}`;

  const screening = await addScreening(sess.orgId, sess.userId, {
    siteId: v.siteId,
    context: v.context,
    subjectName,
    anonymous: v.anonymous,
    ageRange: v.ageRange,
    originCountry: v.originCountry,
    originRegion: v.originRegion,
    destination: v.destination,
    travelHistory,
    contactWithCase: v.contactWithCase,
    symptoms,
    hcwExposure: v.hcwExposure,
    funeralExposure: v.funeralExposure,
    notes: v.notes || "",
    risk: scored.tier,
    action: scored.action,
    rationale: scored.rationale,
    createdBy: sess.userId,
  });

  // Real escalation: urgent/elevated tiers notify the on-call health officer
  // (and, for urgent, org admins/owners). Fire-and-forget so the screener's
  // request returns immediately; delivery is recorded + audited.
  if (scored.tier === "urgent" || scored.tier === "elevated") {
    const officers = (await data.users(sess.orgId)).filter(
      (u) => u.role === "health_officer" || (scored.tier === "urgent" && (u.role === "admin" || u.role === "owner")),
    );
    const subject = `${scored.tier.toUpperCase()} operational tier — ${subjectName}`;
    const body = `${v.context.replace("_", " ")} screening. Action: ${scored.action} (operational triage, not a diagnosis; human review required).`;
    void notifyEvent({
      orgId: sess.orgId,
      severity: scored.tier === "urgent" ? "critical" : "high",
      subject,
      body,
      email: officers[0]?.email,
    });
  }

  return NextResponse.json({ screening, score: scored.score });
}

export async function GET() {
  let sess;
  try {
    sess = requireCapability("screening.read");
  } catch (e) {
    return authErrorResponse(e);
  }
  return NextResponse.json({ screenings: await data.screenings(sess.orgId) });
}
