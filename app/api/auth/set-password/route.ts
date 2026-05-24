import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeSetPasswordToken } from "@/lib/store";
import { setSession } from "@/lib/auth";
import { clientKey, rateLimitAsync, rateLimitResponse } from "@/lib/ratelimit";

const schema = z.object({
  token: z.string().min(8).max(512),
  password: z.string().min(8).max(256),
});

// Completes an invite: an invited user sets their password via the one-time
// token and is signed in. Also used by the password-reset flow.
export async function POST(req: Request) {
  const limit = await rateLimitAsync(clientKey(req, "set-password"), { limit: 5, windowSec: 600 });
  if (!limit.ok) return rateLimitResponse(limit);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const user = consumeSetPasswordToken(parsed.data.token, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 });
  }
  setSession({ userId: user.id, role: user.role, orgId: user.orgId });
  return NextResponse.json({ ok: true });
}
