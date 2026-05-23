import { NextResponse } from "next/server";
import { z } from "zod";
import { adjustResource } from "@/lib/store";
import { authErrorResponse, requireCapability } from "@/lib/auth";

const schema = z.object({
  delta: z.number().int().min(-10000).max(10000),
  reason: z
    .enum(["received", "consumed", "correction", "transfer", "reorder_request"])
    .default("correction"),
  reference: z.string().max(120).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let sess;
  try {
    sess = requireCapability("resource.update");
  } catch (e) {
    return authErrorResponse(e);
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const reasonText = parsed.data.reference
    ? `${parsed.data.reason} (${parsed.data.reference})`
    : parsed.data.reason;
  const r = adjustResource(sess.orgId, params.id, parsed.data.delta, sess.userId, reasonText);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ resource: r });
}
