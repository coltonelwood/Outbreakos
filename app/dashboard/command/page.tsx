import { db } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { SeverityPill } from "@/components/ui/status-pill";
import { Badge } from "@/components/ui/badge";
import { compactNumber } from "@/lib/utils";
import { ShieldAlert, TrendingUp, AlertTriangle, MapPin, Plane, Activity, Hospital, Building2 } from "lucide-react";

const siteKindIcons: Record<string, typeof Plane> = {
  airport: Plane,
  border: MapPin,
  hospital: Hospital,
  clinic: Hospital,
  mine: Activity,
  field_base: Building2,
};

export default function CommandPage() {
  const d = db();
  const totals = d.regions.reduce(
    (acc, r) => ({
      c: acc.c + r.confirmed,
      s: acc.s + r.suspected,
      contacts: acc.contacts + r.contactsMonitored,
    }),
    { c: 0, s: 0, contacts: 0 },
  );
  const corridors = [
    {
      name: "Bundibugyo → Entebbe corridor",
      from: "Bundibugyo, Uganda",
      to: "Entebbe Airport",
      risk: "high",
      detail: "Active cluster + airport screening surge inbound from Bunia.",
    },
    {
      name: "Bunia → Mpondwe corridor",
      from: "Ituri, DRC",
      to: "Mpondwe/Kasese, Uganda",
      risk: "critical",
      detail: "Cross-border land crossings with surge in symptomatic screenings.",
    },
    {
      name: "North Kivu → Kasese corridor",
      from: "North Kivu, DRC",
      to: "Kasese, Uganda",
      risk: "warning",
      detail: "Routine traffic; 1 contact lost to follow-up.",
    },
  ];

  const clusters = [
    { region: "Bundibugyo District", trigger: "+6 suspected in 48h", severity: "high" as const },
    { region: "Ituri Province (DRC)", trigger: "Rising trend across 3 health zones", severity: "high" as const },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Multi-site Command</h1>
        <p className="text-muted-foreground text-sm">
          Boardroom-grade situational picture across every site and corridor.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Sites" value={d.sites.length} intent="default" />
        <StatCard label="Active regions" value={d.regions.length} intent="warning" />
        <StatCard label="Total contacts" value={compactNumber(totals.contacts)} intent="default" />
        <StatCard label="Open critical alerts" value={d.alerts.filter((a) => a.status === "open" && a.severity === "critical").length} intent="critical" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <CardTitle>Risk corridors</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Cross-region movement routes flagged for heightened surveillance.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {corridors.map((c) => (
            <div key={c.name} className="rounded-md border border-border p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-primary" />
                  {c.name}
                </div>
                <SeverityPill severity={c.risk as "high" | "critical" | "warning"} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{c.from} → {c.to}</div>
              <p className="mt-2 text-sm text-muted-foreground">{c.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Suspected cluster detection</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {clusters.map((c) => (
              <div key={c.region} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <div>
                  <div className="font-medium text-sm">{c.region}</div>
                  <div className="text-xs text-muted-foreground">{c.trigger}</div>
                </div>
                <SeverityPill severity={c.severity} />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Clusters are surfaced when the rolling rate of suspected cases
              meaningfully exceeds the baseline for a given region.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {d.sites.map((s) => {
                const Icon = siteKindIcons[s.kind] || Building2;
                return (
                  <div key={s.id} className="rounded-md border border-border p-3 flex items-start gap-3">
                    <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{s.kind.replace("_", " ")} · {s.country}</div>
                      <div className="mt-1">
                        <Badge
                          variant={
                            s.status === "lockdown" ? "critical" : s.status === "monitoring" ? "warning" : "success"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
