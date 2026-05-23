import { NextResponse } from "next/server";
import { z } from "zod";
import { addLead, logAudit } from "@/lib/store";
import { clientKey, rateLimit, rateLimitResponse } from "@/lib/ratelimit";

const schema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional(),
  org: z.string().max(120).optional(),
  role: z.string().max(120).optional(),
  audience: z.string().max(60).optional(),
  intent: z.string().max(60).optional(),
  message: z.string().max(4000).optional(),
  source: z.string().max(120).optional(),
  // honeypot — bots fill, humans don't
  website: z.string().max(0).optional(),
});

async function notifySlack(payload: Record<string, unknown>) {
  const url = process.env.LEADS_WEBHOOK_URL;
  if (!url) return;
  const text = [
    `*New OutbreakOS lead*`,
    `intent: ${payload.intent || "(unknown)"} · audience: ${payload.audience || "(unknown)"}`,
    `email: ${payload.email}`,
    payload.org ? `org: ${payload.org}` : null,
    payload.name ? `name: ${payload.name}` : null,
    payload.role ? `role: ${payload.role}` : null,
    payload.message ? `> ${String(payload.message).slice(0, 600)}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    console.error("[leads] slack webhook failed", err);
  }
}

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req, "leads"), { limit: 5, windowSec: 600 });
  if (!limit.ok) return rateLimitResponse(limit);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  }
  // Honeypot — silently 200, do not store, do not notify.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true });
  }
  const lead = addLead({
    email: parsed.data.email,
    name: parsed.data.name,
    org: parsed.data.org,
    role: parsed.data.role,
    audience: parsed.data.audience,
    intent: parsed.data.intent,
    message: parsed.data.message,
    source: parsed.data.source || "web",
  });
  await notifySlack(parsed.data);
  // Audited globally; owner-side review surface coming in /dashboard/leads.
  logAudit("global", "public", "lead.create", lead.id, { audience: parsed.data.audience });
  return NextResponse.json({ ok: true, leadId: lead.id });
}
