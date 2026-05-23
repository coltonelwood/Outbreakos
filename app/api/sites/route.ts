import { NextResponse } from "next/server";
import { z } from "zod";
import { createSite, data } from "@/lib/store";
import { authErrorResponse, requireCapability } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2).max(120),
  kind: z.enum(["airport", "mine", "hospital", "clinic", "border", "field_base"]),
  country: z.string().min(2).max(80),
  region: z.string().min(1).max(120),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  workersPerDay: z.number().int().min(0).max(1_000_000).optional(),
  status: z.enum(["active", "monitoring", "lockdown"]).default("active"),
});

export async function POST(req: Request) {
  let sess;
  try {
    sess = requireCapability("site.create");
  } catch (e) {
    return authErrorResponse(e);
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const site = createSite(sess.orgId, sess.userId, parsed.data);
  return NextResponse.json({ site });
}

export async function GET() {
  let sess;
  try {
    sess = requireCapability("settings.read");
  } catch (e) {
    return authErrorResponse(e);
  }
  return NextResponse.json({ sites: data.sites(sess.orgId) });
}
