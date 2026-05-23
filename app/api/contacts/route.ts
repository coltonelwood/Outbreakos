import { NextResponse } from "next/server";
import { z } from "zod";
import { addContact, data } from "@/lib/store";
import { authErrorResponse, requireCapability } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(40).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  let sess;
  try {
    sess = requireCapability("contact.create");
  } catch (e) {
    return authErrorResponse(e);
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const c = addContact(sess.orgId, sess.userId, {
    name: parsed.data.name,
    phone: parsed.data.phone,
    monitoringStart: new Date().toISOString(),
    monitoringEnd: new Date(Date.now() + 21 * 86400000).toISOString(),
    status: "active",
    checkins: [{ day: 1, date: new Date().toISOString(), status: "ok" }],
    notes: parsed.data.notes || "",
  });
  return NextResponse.json({ contact: c });
}

export async function GET() {
  let sess;
  try {
    sess = requireCapability("contact.read");
  } catch (e) {
    return authErrorResponse(e);
  }
  return NextResponse.json({ contacts: data.contacts(sess.orgId) });
}
