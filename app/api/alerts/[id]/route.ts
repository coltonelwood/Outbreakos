import { NextResponse } from "next/server";
import { z } from "zod";
import { setAlertStatus } from "@/lib/store";
import { authErrorResponse, requireCapability } from "@/lib/auth";

const schema = z.object({ status: z.enum(["open", "ack", "resolved"]) });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let sess;
  try {
    sess = requireCapability("alert.update");
  } catch (e) {
    return authErrorResponse(e);
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const a = await setAlertStatus(sess.orgId, params.id, parsed.data.status, sess.userId);
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ alert: a });
}
