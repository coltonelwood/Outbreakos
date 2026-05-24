import { NextResponse } from "next/server";
import { z } from "zod";
import { addReport } from "@/lib/store";
import { buildSitRep } from "@/lib/ai";
import { authErrorResponse, requireCapability } from "@/lib/auth";
import { clientKey, rateLimitAsync, rateLimitResponse } from "@/lib/ratelimit";

const schema = z.object({
  kind: z.enum([
    "daily_sitrep",
    "exec_briefing",
    "airport_screening",
    "mining_workforce",
    "ngo_donor",
  ]),
});

export async function POST(req: Request) {
  let sess;
  try {
    sess = requireCapability("report.create");
  } catch (e) {
    return authErrorResponse(e);
  }
  const limit = await rateLimitAsync(clientKey(req, `rpt:${sess.orgId}`), { limit: 10, windowSec: 60 });
  if (!limit.ok) return rateLimitResponse(limit);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const draft = await buildSitRep(sess.orgId, parsed.data.kind, sess.userId);
  const saved = await addReport(draft);
  return NextResponse.json({ report: saved });
}
