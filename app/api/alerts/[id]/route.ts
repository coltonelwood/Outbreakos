import { NextResponse } from "next/server";
import { z } from "zod";
import { setAlertStatus } from "@/lib/store";
import { getSession } from "@/lib/auth";

const schema = z.object({ status: z.enum(["open", "ack", "resolved"]) });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const sess = getSession();
  const a = setAlertStatus(params.id, parsed.data.status, sess?.userId || "u_demo");
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ alert: a });
}
