import { NextResponse } from "next/server";
import { aiCommand } from "@/lib/ai";
import { logAudit } from "@/lib/store";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const session = getSession();
  const result = await aiCommand({
    user: String(body.user ?? "").slice(0, 2000),
    intent: body.intent,
  });
  logAudit(session?.userId || "anonymous", "ai.invoke", "ai", { intent: body.intent });
  return NextResponse.json(result);
}
