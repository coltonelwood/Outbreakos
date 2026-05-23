import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { OutbreakRegion } from "@/lib/types";
import { SeverityPill } from "@/components/ui/status-pill";

export function RegionList({ regions }: { regions: OutbreakRegion[] }) {
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
            <th className="text-left py-2 px-5 font-medium">Region</th>
            <th className="text-right py-2 px-2 font-medium">Confirmed</th>
            <th className="text-right py-2 px-2 font-medium">Suspected</th>
            <th className="text-right py-2 px-2 font-medium">Deaths</th>
            <th className="text-right py-2 px-2 font-medium">Contacts</th>
            <th className="text-center py-2 px-2 font-medium">Trend</th>
            <th className="text-center py-2 px-5 font-medium">Severity</th>
          </tr>
        </thead>
        <tbody>
          {regions.map((r) => {
            const TIcon = r.trend === "rising" ? TrendingUp : r.trend === "declining" ? TrendingDown : Minus;
            const trendColor =
              r.trend === "rising"
                ? "text-destructive"
                : r.trend === "declining"
                  ? "text-[hsl(var(--success))]"
                  : "text-muted-foreground";
            return (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="py-3 px-5">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.country}</div>
                </td>
                <td className="py-3 px-2 text-right tabular-nums font-medium">{r.confirmed}</td>
                <td className="py-3 px-2 text-right tabular-nums">{r.suspected}</td>
                <td className="py-3 px-2 text-right tabular-nums text-destructive">{r.deaths}</td>
                <td className="py-3 px-2 text-right tabular-nums">{r.contactsMonitored}</td>
                <td className="py-3 px-2 text-center">
                  <TIcon className={"inline h-4 w-4 " + trendColor} />
                </td>
                <td className="py-3 px-5 text-center">
                  <SeverityPill severity={r.severity} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
