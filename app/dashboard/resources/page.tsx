import { data } from "@/lib/store";
import { requireSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { ResourcesClient } from "./resources-client";
import { Boxes, AlertTriangle, TrendingDown } from "lucide-react";

export default async function ResourcesPage() {
  const sess = requireSession();
  const [resources, sites] = await Promise.all([data.resources(sess.orgId), data.sites(sess.orgId)]);
  const totalItems = resources.length;
  const lowStock = resources.filter((r) => r.onHand < r.minStock).length;
  const criticalDays = resources
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
        <Card className={minDays && minDays < 5 ? "border-destructive/40 bg-destructive/5" : ""}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Lowest cover (days)</div>
              <div className="mt-2 text-3xl font-bold tabular-nums">{minDays || "—"}</div>
            </div>
            <TrendingDown className={"h-6 w-6 " + (minDays && minDays < 5 ? "text-destructive" : "text-muted-foreground")} />
          </CardContent>
        </Card>
      </div>

      <ResourcesClient resources={resources} sites={sites} />
    </div>
  );
}
