import { NextResponse } from "next/server";
import { aiCommand } from "@/lib/ai";
import { logAudit } from "@/lib/store";
import { authErrorResponse, requireCapability } from "@/lib/auth";
import { clientKey, rateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { invalidate } from "@/lib/cache";

export async function POST(req: Request) {
  let sess;
  try {
    sess = requireCapability("ai.invoke");
  } catch (e) {
    return authErrorResponse(e);
  }
  // Tight limit on AI to control cost and abuse.
  const limit = rateLimit(clientKey(req, `ai:${sess.orgId}`), { limit: 20, windowSec: 60 });
  if (!limit.ok) return rateLimitResponse(limit);

  const body = await req.json().catch(() => ({}));
  const result = await aiCommand({
    orgId: sess.orgId,
    user: String(body.user ?? "").slice(0, 2000),
    intent: body.intent,
  });
  // Manual refresh from the dashboard clears the per-org cache.
  if (body.refresh) invalidate(`ai:briefing:${sess.orgId}`);
  logAudit(sess.orgId, sess.userId, "ai.invoke", "ai", {
    intent: body.intent,
    provider: result.provider,
  });
  return NextResponse.json(result);
}
