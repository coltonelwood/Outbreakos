import { NextResponse } from "next/server";
import { z } from "zod";
import { addAlert, data } from "@/lib/store";
import { authErrorResponse, requireCapability } from "@/lib/auth";

const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
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
  let sess;
  try {
    sess = requireCapability("alert.create");
  } catch (e) {
    return authErrorResponse(e);
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const a = await addAlert(sess.orgId, sess.userId, parsed.data);
  return NextResponse.json({ alert: a });
}

export async function GET() {
  let sess;
  try {
    sess = requireCapability("alert.read");
  } catch (e) {
    return authErrorResponse(e);
  }
  return NextResponse.json({ alerts: await data.alerts(sess.orgId) });
}
