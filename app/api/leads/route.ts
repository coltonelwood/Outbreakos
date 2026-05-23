import { NextResponse } from "next/server";
import { db, logAudit } from "@/lib/store";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // In demo mode we just record an audit event. Wire this to your CRM /
  // ticketing system in production (HubSpot, Salesforce, Linear, etc.).
  logAudit("public", "lead.create", "lead", body);
  // Mirror to console for development visibility
  console.log("[lead]", body);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  // Surface recent leads only for operators (audit feed).
  const leads = db()
    .audit.filter((a) => a.action === "lead.create")
    .slice(0, 50);
  return NextResponse.json({ leads });
}
