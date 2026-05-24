import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";
import { revokeUserSessions } from "@/lib/store";

// Revoke every session for the current user (this device and all others).
export async function POST() {
  const s = getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  revokeUserSessions(s.userId, s.userId, s.orgId);
  clearSession();
  return NextResponse.json({ ok: true });
}
