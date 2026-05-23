import { NextResponse } from "next/server";
import { z } from "zod";
import { updateSettings } from "@/lib/store";
import { authErrorResponse, requireCapability } from "@/lib/auth";

const riskWeights = z.object({
  fever: z.number().int().min(0).max(100),
  bleeding: z.number().int().min(0).max(100),
  contact: z.number().int().min(0).max(100),
  travel: z.number().int().min(0).max(100),
  hcw: z.number().int().min(0).max(100),
  funeral: z.number().int().min(0).max(100),
});

const schema = z.object({
  riskWeights: riskWeights.optional(),
  aiProvider: z.enum(["openai", "anthropic", "none"]).optional(),
  messagingProvider: z.enum(["twilio", "whatsapp", "none"]).optional(),
});

export async function PATCH(req: Request) {
  let sess;
  try {
    sess = requireCapability("settings.update");
  } catch (e) {
    return authErrorResponse(e);
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const settings = updateSettings(sess.orgId, parsed.data, sess.userId);
  return NextResponse.json({ settings });
}
