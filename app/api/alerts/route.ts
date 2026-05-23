import { NextResponse } from "next/server";
import { z } from "zod";
import { addAlert, db } from "@/lib/store";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(["info", "warning", "high", "critical"]),
  category: z.enum([
    "high_risk_screening",
    "missed_checkin",
    "cluster_increase",
    "ppe_low_stock",
    "border_risk",
    "lab_pending",
    "manual",
  ]),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const a = addAlert(parsed.data);
  return NextResponse.json({ alert: a });
}

export async function GET() {
  return NextResponse.json({ alerts: db().alerts });
}
