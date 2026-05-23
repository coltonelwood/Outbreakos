import { NextResponse } from "next/server";
import { z } from "zod";
import { db, logAudit, verifyPassword } from "@/lib/store";
import { setSession } from "@/lib/auth";
import { clientKey, rateLimit, rateLimitResponse } from "@/lib/ratelimit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req, "login"), { limit: 5, windowSec: 60 });
  if (!limit.ok) return rateLimitResponse(limit);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }
  const { email, password } = parsed.data;
  const user = db().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  // Constant-ish work either way so timing doesn't reveal whether the email exists.
  const valid = !!user && verifyPassword(user.id, password);
  if (!user || !valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  setSession({ userId: user.id, role: user.role, orgId: user.orgId });
  logAudit(user.orgId, user.id, "auth.login", user.id);
  return NextResponse.json({ ok: true });
}
