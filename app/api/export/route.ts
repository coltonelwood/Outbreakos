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
  const [org, users, sites, regions, cases, screenings, contacts, alerts, resources, reports, audit, settings] =
    await Promise.all([
      data.org(orgId), data.users(orgId), data.sites(orgId), data.regions(orgId),
      data.cases(orgId), data.screenings(orgId), data.contacts(orgId), data.alerts(orgId),
      data.resources(orgId), data.reports(orgId), data.audit(orgId), data.settings(orgId),
    ]);
  const payload = {
    exportedAt: new Date().toISOString(),
    org, users, sites, regions, cases, screenings, contacts, alerts, resources, reports, audit, settings,
  };
  await logAudit(orgId, sess.userId, "org.export", orgId);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="outbreakos-${orgId}-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
