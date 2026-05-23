import { NextResponse } from "next/server";
import { z } from "zod";
import { adjustResource } from "@/lib/store";
import { getSession } from "@/lib/auth";

const schema = z.object({ delta: z.number().int() });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const sess = getSession();
  const r = adjustResource(params.id, parsed.data.delta, sess?.userId || "u_demo");
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ resource: r });
}
