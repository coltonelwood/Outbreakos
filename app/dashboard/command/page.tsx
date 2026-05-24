import { data } from "@/lib/store";
import { requireSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { SeverityPill } from "@/components/ui/status-pill";
import { Badge } from "@/components/ui/badge";
import { compactNumber } from "@/lib/utils";
import {
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Plane,
  Activity,
  Hospital,
  Building2,
} from "lucide-react";
import type { Severity } from "@/lib/types";

const siteKindIcons: Record<string, typeof Plane> = {
  airport: Plane,
  border: MapPin,
  hospital: Hospital,
  clinic: Hospital,
  mine: Activity,
  field_base: Building2,
};

export default async function CommandPage() {
  const sess = requireSession();
  const orgId = sess.orgId;
  const [regions, sites, alerts, screenings] = await Promise.all([
    data.regions(orgId), data.sites(orgId), data.alerts(orgId), data.screenings(orgId),
  ]);

  const totals = regions.reduce(
    (acc, r) => ({
      c: acc.c + r.confirmed,
      s: acc.s + r.suspected,
      contacts: acc.contacts + r.contactsMonitored,
    }),
    { c: 0, s: 0, contacts: 0 },
  );

  // Compute risk corridors from sites + regions, not hardcoded.
  const corridors = computeCorridors(sites, regions);

  // Suspected cluster detection: regions with rising trend AND suspected count
  // recently above their confirmed count by a noteworthy margin.
  const clusters = regions
    .filter((r) => r.trend === "rising" && r.suspected > r.confirmed)
    .map((r) => ({
      region: `${r.name} (${r.country})`,
      trigger: `${r.suspected} suspected vs ${r.confirmed} confirmed; trend rising`,
      severity: r.severity,
    }));

  const screenedRising =
    screenings.filter(
      (s) =>
        Date.now() - new Date(s.createdAt).getTime() < 86400000 &&
        (s.risk === "elevated" || s.risk === "urgent"),
    ).length;
  if (screenedRising >= 5) {
    clusters.push({
      region: "Cross-screening signal",
      trigger: `${screenedRising} elevated/urgent screenings in the last 24h`,
      severity: "high",
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Multi-site Command</h1>
        <p className="text-muted-foreground text-sm">
          Boardroom-grade situational picture across every site and corridor.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Sites" value={sites.length} />
        <StatCard label="Active regions" value={regions.length} intent="warning" />
        <StatCard label="Total contacts" value={compactNumber(totals.contacts)} />
        <StatCard
          label="Open critical alerts"
          value={alerts.filter((a) => a.status === "open" && a.severity === "critical").length}
          intent="critical"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <CardTitle>Risk corridors</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Computed from your sites + regions where movement and active surveillance overlap.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {corridors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No corridors detected yet. Add sites in active surveillance regions to see corridors.
            </p>
          ) : (
            corridors.map((c) => (
              <div key={c.name} className="rounded-md border border-border p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-primary" />
                    {c.name}
                  </div>
                  <SeverityPill severity={c.risk} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {c.from} → {c.to}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{c.detail}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Suspected cluster signals</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {clusters.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No cluster signals detected. Surveillance nominal.
              </p>
            ) : (
              clusters.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div>
                    <div className="font-medium text-sm">{c.region}</div>
                    <div className="text-xs text-muted-foreground">{c.trigger}</div>
                  </div>
                  <SeverityPill severity={c.severity} />
                </div>
              ))
            )}
            <p className="text-xs text-muted-foreground">
              Signals are based on rising trend, suspected-vs-confirmed ratio, and
              recent screening escalations. Human review required before acting.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <CardTitle>Sites at a glance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {sites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sites yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sites.map((s) => {
                  const Icon = siteKindIcons[s.kind] || Building2;
                  return (
                    <div
                      key={s.id}
                      className="rounded-md border border-border p-3 flex items-start gap-3"
                    >
                      <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {s.kind.replace("_", " ")} · {s.country}
                        </div>
                        <div className="mt-1">
                          <Badge
                            variant={
                              s.status === "lockdown"
                                ? "critical"
                                : s.status === "monitoring"
                                  ? "warning"
                                  : "success"
                            }
                            className="text-xs"
                          >
                            {s.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function computeCorridors(
  sites: Awaited<ReturnType<typeof data.sites>>,
  regions: Awaited<ReturnType<typeof data.regions>>,
) {
  const out: { name: string; from: string; to: string; risk: Severity; detail: string }[] = [];
  // For every pair of (site near active region, site in another country) pair
  // them as a corridor, severity = max of the source region's severity.
  const activeRegions = regions.filter((r) => r.severity === "high" || r.severity === "critical");
  for (const r of activeRegions) {
    const near = sites.filter((s) => Math.hypot(s.lat - r.lat, s.lng - r.lng) < 4);
    const far = sites.filter((s) => !near.includes(s));
    for (const a of near) {
      for (const b of far) {
        if (out.length >= 6) break;
        out.push({
          name: `${a.name} → ${b.name} corridor`,
          from: `${a.region}, ${a.country}`,
          to: `${b.region}, ${b.country}`,
          risk: r.severity,
          detail: `Active surveillance in ${r.name}. Cross-site movement between ${a.name} and ${b.name} flagged for heightened screening.`,
        });
      }
    }
  }
  return out;
}
