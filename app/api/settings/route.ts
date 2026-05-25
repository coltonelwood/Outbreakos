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

const riskThresholds = z
  .object({
    monitor: z.number().int().min(0).max(500),
    elevated: z.number().int().min(0).max(500),
    urgent: z.number().int().min(0).max(500),
  })
  .refine((t) => t.monitor < t.elevated && t.elevated < t.urgent, {
    message: "Thresholds must be strictly ascending: monitor < elevated < urgent",
  });

const onboarding = z.object({
  dismissed: z.boolean().optional(),
  completedSteps: z.array(z.string().max(40)).max(20).optional(),
});

const schema = z.object({
  riskWeights: riskWeights.optional(),
  riskThresholds: riskThresholds.optional(),
  aiProvider: z.enum(["openai", "anthropic", "none"]).optional(),
  messagingProvider: z.enum(["twilio", "whatsapp", "none"]).optional(),
  onboarding: onboarding.optional(),
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
  const settings = await updateSettings(sess.orgId, parsed.data, sess.userId);
  return NextResponse.json({ settings });
}
