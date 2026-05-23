// Demo auth using signed-ish cookies. Production swap-in: replace these two
// helpers with Supabase server client + RLS.

import { cookies } from "next/headers";
import { db } from "./store";
import type { Profile, Role } from "./types";

const COOKIE_NAME = "outbreakos_session";

export type Session = { userId: string; role: Role; orgId: string };

export function getSession(): Session | null {
  const c = cookies().get(COOKIE_NAME)?.value;
  if (!c) return null;
  try {
    const parsed = JSON.parse(Buffer.from(c, "base64").toString());
    if (!parsed.userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setSession(s: Session) {
  cookies().set(COOKIE_NAME, Buffer.from(JSON.stringify(s)).toString("base64"), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

export function requireSession(): Session {
  const s = getSession();
  if (!s) throw new Error("Unauthorized");
  return s;
}

export function currentUser(): Profile | null {
  const s = getSession();
  if (!s) return null;
  return db().users.find((u) => u.id === s.userId) ?? null;
}

export function canEdit(role: Role | undefined) {
  return role === "owner" || role === "admin" || role === "health_officer";
}

export function canScreen(role: Role | undefined) {
  return canEdit(role) || role === "screener";
}
