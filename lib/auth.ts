// Tenant-aware auth. Sessions are HMAC-signed so a user cannot forge a
// cookie by editing it client-side. In production swap this module for
// Supabase auth — the session shape is identical.

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { currentSessionVersion, isDeactivated, userById } from "./store";
import type { Profile, Role } from "./types";
import { can, PermissionError, type Capability } from "./permissions";

const COOKIE_NAME = "outbreakos_session";

function secret(): string {
  // In dev we accept a stable default so demo accounts work out of the box.
  // In production set SESSION_SECRET to a high-entropy value.
  return (
    process.env.SESSION_SECRET ||
    (process.env.NODE_ENV === "production"
      ? "" // intentionally invalid so a missing prod secret fails closed
      : "outbreakos-dev-secret-rotate-in-production")
  );
}

function sign(payload: string): string {
  const s = secret();
  if (!s) throw new Error("SESSION_SECRET is required in production");
  return createHmac("sha256", s).update(payload).digest("base64url");
}

function verify(payload: string, sig: string): boolean {
  try {
    const expected = sign(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export interface Session {
  userId: string;
  role: Role;
  orgId: string;
  iat: number;
  sv: number; // session version — must match the user's current version
}

export function getSession(): Session | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  if (!verify(payload, sig)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!decoded.userId || !decoded.orgId || !decoded.role) return null;
    // Sessions older than 7d are rejected even if the cookie is still around.
    if (Date.now() - (decoded.iat ?? 0) > 7 * 86400 * 1000) return null;
    // Signature + expiry are validated synchronously here (no DB).
    // Live revocation (logout-all / role change / deactivation) is enforced by
    // the async assertSessionActive() in the dashboard layout and mutating
    // API routes, which compares this cookie's `sv` against the DB.
    return decoded as Session;
  } catch {
    return null;
  }
}

export async function setSession(s: Omit<Session, "iat" | "sv">) {
  const session: Session = {
    ...s,
    iat: Date.now(),
    sv: await currentSessionVersion(s.userId),
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const value = `${payload}.${sign(payload)}`;
  cookies().set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

export function requireSession(): Session {
  const s = getSession();
  if (!s) throw new UnauthorizedError();
  return s;
}

export function requireCapability(cap: Capability): Session {
  const s = requireSession();
  if (!can(s.role, cap)) throw new PermissionError(cap);
  return s;
}

export async function currentUser(): Promise<Profile | null> {
  const s = getSession();
  if (!s) return null;
  return userById(s.userId);
}

// Live revocation check (async, hits the DB). Returns false if the user was
// deactivated or their sessions were revoked since this cookie was issued.
export async function isSessionActive(s: Session): Promise<boolean> {
  if (await isDeactivated(s.userId)) return false;
  return (s.sv ?? 0) === (await currentSessionVersion(s.userId));
}

// Throws UnauthorizedError if the (already signature-valid) session has been
// revoked/deactivated. Use in the dashboard layout + mutating API routes.
export async function assertSessionActive(s: Session): Promise<void> {
  if (!(await isSessionActive(s))) throw new UnauthorizedError();
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export function authErrorResponse(err: unknown): Response {
  if (err instanceof UnauthorizedError) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (err instanceof PermissionError) {
    return new Response(
      JSON.stringify({ error: `Forbidden: missing ${err.capability}` }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }
  return new Response(JSON.stringify({ error: "Internal error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
