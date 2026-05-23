import { NextResponse } from "next/server";
import { db, logAudit } from "@/lib/store";
import { setSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = db().users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || password !== "demo") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  setSession({ userId: user.id, role: user.role, orgId: user.orgId });
  logAudit(user.id, "auth.login", user.id);
  return NextResponse.json({ ok: true });
}
