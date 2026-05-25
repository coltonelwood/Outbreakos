import { NextResponse } from "next/server";
import { z } from "zod";
import { userByEmail, logAudit, verifyPassword } from "@/lib/store";
import { setSession } from "@/lib/auth";
import { clientKey, rateLimitAsync, rateLimitResponse } from "@/lib/ratelimit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const limit = await rateLimitAsync(clientKey(req, "login"), { limit: 5, windowSec: 60 });
  if (!limit.ok) return rateLimitResponse(limit);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }
  const { email, password } = parsed.data;
  const user = await userByEmail(email);
  const valid = !!user && (await verifyPassword(user.id, password));
  if (!user || !valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await setSession({ userId: user.id, role: user.role, orgId: user.orgId });
  await logAudit(user.orgId, user.id, "auth.login", user.id);
  return NextResponse.json({ ok: true });
}
