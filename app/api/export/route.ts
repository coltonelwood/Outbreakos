import { NextResponse } from "next/server";
import { db, logAudit } from "@/lib/store";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = getSession();
  const d = db();
  const payload = {
    exportedAt: new Date().toISOString(),
    org: d.org,
    users: d.users,
    sites: d.sites,
    regions: d.regions,
    cases: d.cases,
    screenings: d.screenings,
    contacts: d.contacts,
    alerts: d.alerts,
    resources: d.resources,
    reports: d.reports,
    audit: d.audit,
    settings: d.settings,
  };
  logAudit(session?.userId || "system", "org.export", d.org.id);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
