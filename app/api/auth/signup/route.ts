import { NextResponse } from "next/server";
import { db, logAudit } from "@/lib/store";
import { setSession } from "@/lib/auth";
import { uid } from "@/lib/utils";

export async function POST(req: Request) {
  const body = await req.json();
  // Demo mode: attach to existing demo org so user lands on the seeded scenario.
  const orgId = db().org.id;
  const userId = uid("u");
  const profile = {
    id: userId,
    orgId,
    email: String(body.email || ""),
    name: String(body.name || ""),
    role: "owner" as const,
    createdAt: new Date().toISOString(),
  };
  db().users.unshift(profile);
  setSession({ userId, role: "owner", orgId });
  logAudit(userId, "auth.signup", userId, { org: body.org, mode: body.mode });
  return NextResponse.json({ ok: true });
}
