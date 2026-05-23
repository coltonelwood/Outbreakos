import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrg, createUser, db, logAudit } from "@/lib/store";
import { setSession } from "@/lib/auth";
import { clientKey, rateLimitAsync, rateLimitResponse } from "@/lib/ratelimit";
import type { OpsMode } from "@/lib/types";

const schema = z.object({
  org: z.string().min(2).max(120),
  mode: z
    .enum(["standard", "mining_site", "airport_poe", "gov_emergency", "ngo_field"])
    .default("standard"),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(256),
});

export async function POST(req: Request) {
  const limit = await rateLimitAsync(clientKey(req, "signup"), { limit: 3, windowSec: 600 });
  if (!limit.ok) return rateLimitResponse(limit);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const v = parsed.data;

  // Email uniqueness — single tenant per email in demo mode. Real auth
  // (Supabase) handles this with a unique constraint.
  if (db().users.some((u) => u.email.toLowerCase() === v.email.toLowerCase())) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  // CRITICAL: new organization per signup. The signing-up user becomes the
  // owner of *their own* org. They never see another tenant's data.
  const org = createOrg(v.org, v.mode as OpsMode);
  const user = createUser(
    org.id,
    { email: v.email, name: v.name, role: "owner" },
    v.password,
  );
  setSession({ userId: user.id, role: user.role, orgId: org.id });
  logAudit(org.id, user.id, "org.create", org.id, { mode: v.mode });
  logAudit(org.id, user.id, "auth.signup", user.id);
  return NextResponse.json({ ok: true, orgId: org.id });
}
