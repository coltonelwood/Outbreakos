import { NextResponse } from "next/server";
import { z } from "zod";
import { addReport } from "@/lib/store";
import { buildSitRep } from "@/lib/ai";
import { getSession } from "@/lib/auth";

const schema = z.object({
  kind: z.enum(["daily_sitrep", "exec_briefing", "airport_screening", "mining_workforce", "ngo_donor"]),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const sess = getSession();
  const draft = buildSitRep(parsed.data.kind, sess?.userId || "u_demo");
  const saved = addReport(draft);
  return NextResponse.json({ report: saved });
}
