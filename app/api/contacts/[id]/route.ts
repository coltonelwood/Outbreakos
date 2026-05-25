import { NextResponse } from "next/server";
import { z } from "zod";
import { logCheckin, updateContactStatus } from "@/lib/store";
import { authErrorResponse, requireCapability } from "@/lib/auth";

const patch = z.object({
  status: z.enum(["active", "cleared", "escalated", "lost_to_follow_up"]).optional(),
  checkin: z
    .object({
      day: z.number().int().min(1).max(21),
      status: z.enum(["ok", "symptom", "missed"]),
    })
    .optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let sess;
  try {
    sess = requireCapability("contact.update");
  } catch (e) {
    return authErrorResponse(e);
  }
  const parsed = patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  let c = null;
  if (parsed.data.status) {
    c = await updateContactStatus(sess.orgId, params.id, parsed.data.status, sess.userId);
  }
  if (parsed.data.checkin) {
    c = await logCheckin(sess.orgId, params.id, parsed.data.checkin.day, parsed.data.checkin.status, sess.userId);
  }
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ contact: c });
}
