import { db } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Activity, Hospital, Building2, MapPin } from "lucide-react";

const siteKindIcons: Record<string, typeof Plane> = {
  airport: Plane,
  border: MapPin,
  hospital: Hospital,
  clinic: Hospital,
  mine: Activity,
  field_base: Building2,
};

export default function SitesPage() {
  const d = db();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Sites</h1>
        <p className="text-muted-foreground text-sm">
          All sites under this organization's command. Each site has its own
          screening lanes, resources, and alerts.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {d.sites.map((s) => {
          const Icon = siteKindIcons[s.kind] || Building2;
          const siteResources = d.resources.filter((r) => r.siteId === s.id);
          const lowStock = siteResources.filter((r) => r.onHand < r.minStock).length;
          return (
            <Card key={s.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{s.name}</CardTitle>
                    <p className="text-xs text-muted-foreground capitalize">
                      {s.kind.replace("_", " ")} · {s.country} / {s.region}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      s.status === "lockdown" ? "critical" : s.status === "monitoring" ? "warning" : "success"
                    }
                  >
                    {s.status}
                  </Badge>
                </div>
                {s.workersPerDay !== undefined && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Throughput / day</span>
                    <span className="font-medium tabular-nums">{s.workersPerDay.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Tracked resources</span>
                  <span className="font-medium tabular-nums">{siteResources.length}</span>
                </div>
                {lowStock > 0 && (
                  <div className="mt-3 rounded-md border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5 px-3 py-2 text-xs text-[hsl(var(--warning))]">
                    {lowStock} resource{lowStock === 1 ? "" : "s"} below threshold.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
