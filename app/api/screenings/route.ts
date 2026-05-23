import { NextResponse } from "next/server";
import { z } from "zod";
import { addScreening, db } from "@/lib/store";
import { scoreScreening } from "@/lib/risk";
import { getSession } from "@/lib/auth";

const schema = z.object({
  context: z.enum(["airport", "site_entry", "clinic"]),
  siteId: z.string(),
  subjectName: z.string().optional(),
  anonymous: z.boolean(),
  ageRange: z.enum(["0-17", "18-39", "40-59", "60+"]),
  originCountry: z.string(),
  originRegion: z.string(),
  destination: z.string(),
  travelHistory: z.string().optional(),
  contactWithCase: z.boolean(),
  fever: z.boolean(),
  vomitingDiarrhea: z.boolean(),
  unexplainedBleeding: z.boolean(),
  fatigue: z.boolean(),
  headache: z.boolean(),
  hcwExposure: z.boolean(),
  funeralExposure: z.boolean(),
  notes: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(req: Request) {
  const sess = getSession();
  const parsed = schema.safeParse(await req.json());
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
  const travelHistory = (v.travelHistory || "").split(",").map((t) => t.trim()).filter(Boolean);
  const scored = scoreScreening({
    symptoms,
    contactWithCase: v.contactWithCase,
    travelHistory,
    hcwExposure: v.hcwExposure,
    funeralExposure: v.funeralExposure,
    originRegion: v.originRegion,
  });

  const subjectName =
    v.subjectName?.trim() ||
    `Anon-${(v.siteId || "X").slice(-3).toUpperCase()}-${Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0")}`;

  const screening = addScreening({
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
    risk: scored.risk,
    action: scored.action,
    rationale: scored.rationale,
    createdBy: sess?.userId || v.userId || "u_demo",
  });

  return NextResponse.json({ screening, score: scored.score });
}

export async function GET() {
  return NextResponse.json({ screenings: db().screenings });
}
