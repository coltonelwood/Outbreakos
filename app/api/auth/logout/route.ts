import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";
import { logAudit } from "@/lib/store";

export async function POST() {
  const s = getSession();
  if (s) await logAudit(s.orgId, s.userId, "auth.logout", s.userId);
  clearSession();
  return NextResponse.json({ ok: true });
}
