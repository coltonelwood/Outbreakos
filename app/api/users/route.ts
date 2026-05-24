import { NextResponse } from "next/server";
import { z } from "zod";
import { changeUserRole, data, isDeactivated, inviteUser, setUserActive } from "@/lib/store";
import { authErrorResponse, requireCapability } from "@/lib/auth";

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120),
  role: z.enum(["admin", "health_officer", "screener", "viewer"]),
});

const patchSchema = z.object({
  userId: z.string(),
  role: z.enum(["admin", "health_officer", "screener", "viewer"]).optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  let sess;
  try {
    sess = requireCapability("user.invite");
  } catch (e) {
    return authErrorResponse(e);
  }
  const list = await data.users(sess.orgId);
  const users = await Promise.all(
    list.map(async (u) => ({ ...u, deactivated: await isDeactivated(u.id) })),
  );
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  let sess;
  try {
    sess = requireCapability("user.invite");
  } catch (e) {
    return authErrorResponse(e);
  }
  const parsed = inviteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const existing = await data.users(sess.orgId);
  if (existing.some((u) => u.email.toLowerCase() === parsed.data.email.toLowerCase())) {
    return NextResponse.json({ error: "A user with that email already exists in your org." }, { status: 409 });
  }
  const { user, token } = await inviteUser(
    sess.orgId,
    sess.userId,
    parsed.data.email,
    parsed.data.name,
    parsed.data.role,
  );
  // Until an email provider is configured, surface the set-password link to the
  // inviting admin so they can deliver it out-of-band. With email configured,
  // this is sent directly and NOT returned.
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  const inviteLink = `${base}/set-password?token=${token}`;
  const emailConfigured = Boolean(process.env.RESEND_API_KEY || process.env.SMTP_URL);
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    inviteLink: emailConfigured ? undefined : inviteLink,
    emailSent: emailConfigured,
  });
}

export async function PATCH(req: Request) {
  let sess;
  try {
    sess = requireCapability("user.invite");
  } catch (e) {
    return authErrorResponse(e);
  }
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { userId, role, active } = parsed.data;
  // Guard: cannot change your own role or deactivate yourself.
  if (userId === sess.userId) {
    return NextResponse.json({ error: "You cannot modify your own account here." }, { status: 400 });
  }
  let user = null;
  if (role) user = await changeUserRole(sess.orgId, userId, role, sess.userId);
  if (active !== undefined) user = await setUserActive(sess.orgId, userId, active, sess.userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
