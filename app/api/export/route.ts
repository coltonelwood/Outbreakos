import { NextResponse } from "next/server";
import { data, logAudit } from "@/lib/store";
import { authErrorResponse, requireCapability } from "@/lib/auth";

export async function GET() {
  let sess;
  try {
    sess = requireCapability("org.export");
  } catch (e) {
    return authErrorResponse(e);
  }
  const orgId = sess.orgId;
  const payload = {
    exportedAt: new Date().toISOString(),
    org: data.org(orgId),
    users: data.users(orgId),
    sites: data.sites(orgId),
    regions: data.regions(orgId),
    cases: data.cases(orgId),
    screenings: data.screenings(orgId),
    contacts: data.contacts(orgId),
    alerts: data.alerts(orgId),
    resources: data.resources(orgId),
    reports: data.reports(orgId),
    audit: data.audit(orgId),
    settings: data.settings(orgId),
  };
  logAudit(orgId, sess.userId, "org.export", orgId);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="outbreakos-${orgId}-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
