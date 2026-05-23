import { db } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourcesClient } from "./resources-client";
import { Boxes, AlertTriangle, TrendingDown } from "lucide-react";

export default function ResourcesPage() {
  const d = db();
  const totalItems = d.resources.length;
  const lowStock = d.resources.filter((r) => r.onHand < r.minStock).length;
  const criticalDays = d.resources
    .filter((r) => r.burnRatePerDay > 0)
    .map((r) => Math.floor(r.onHand / r.burnRatePerDay))
    .filter((d) => d > 0);
  const minDays = criticalDays.length ? Math.min(...criticalDays) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Resource Logistics</h1>
        <p className="text-muted-foreground text-sm">
          PPE, sample kits, isolation beds, staff, vehicles — across all sites.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Tracked items</div>
              <div className="mt-2 text-3xl font-bold tabular-nums">{totalItems}</div>
            </div>
            <Boxes className="h-6 w-6 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className={lowStock ? "border-[hsl(var(--warning))]/40 bg-[hsl(var(--warning))]/5" : ""}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Below threshold</div>
              <div className="mt-2 text-3xl font-bold tabular-nums">{lowStock}</div>
            </div>
            <AlertTriangle className="h-6 w-6 text-[hsl(var(--warning))]" />
          </CardContent>
        </Card>
        <Card className={minDays < 5 ? "border-destructive/40 bg-destructive/5" : ""}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Lowest cover (days)</div>
              <div className="mt-2 text-3xl font-bold tabular-nums">{minDays || "—"}</div>
            </div>
            <TrendingDown className={"h-6 w-6 " + (minDays < 5 ? "text-destructive" : "text-muted-foreground")} />
          </CardContent>
        </Card>
      </div>

      <ResourcesClient resources={d.resources} sites={d.sites} />
    </div>
  );
}
