"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResourceItem, Site } from "@/lib/types";

export function ResourcesClient({ resources: initial, sites }: { resources: ResourceItem[]; sites: Site[] }) {
  const router = useRouter();
  const [resources, setResources] = useState(initial);
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [forecast, setForecast] = useState<string | null>(null);

  async function adjust(id: string, delta: number) {
    const r = await fetch(`/api/resources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta }),
    });
    if (r.ok) {
      setResources((arr) => arr.map((x) => (x.id === id ? { ...x, onHand: Math.max(0, x.onHand + delta) } : x)));
      router.refresh();
    }
  }

  async function generateForecast() {
    const r = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "resource_request", user: "Generate a 7-day resource forecast and reorder recommendations." }),
    });
    const j = await r.json();
    setForecast(j.text);
  }

  const filtered = siteFilter === "all" ? resources : resources.filter((r) => r.siteId === siteFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setSiteFilter("all")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium",
              siteFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            All sites
          </button>
          {sites.map((s) => (
            <button
              key={s.id}
              onClick={() => setSiteFilter(s.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium",
                siteFilter === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
        <Button variant="outline" onClick={generateForecast}>
          <ClipboardList className="h-4 w-4" /> AI resource forecast
        </Button>
      </div>

      {forecast && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">AI resource forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">{forecast}</pre>
            <p className="mt-3 text-xs text-muted-foreground">
              AI output requires human review before procurement actions.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Inventory ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                <tr>
                  <th className="text-left py-2 px-5 font-medium">Item</th>
                  <th className="text-left py-2 px-2 font-medium">Site</th>
                  <th className="text-right py-2 px-2 font-medium">On hand</th>
                  <th className="text-right py-2 px-2 font-medium">Min</th>
                  <th className="text-right py-2 px-2 font-medium">Burn / day</th>
                  <th className="text-right py-2 px-2 font-medium">Days cover</th>
                  <th className="text-center py-2 px-5 font-medium">Adjust</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const site = sites.find((s) => s.id === r.siteId);
                  const low = r.onHand < r.minStock;
                  const days = r.burnRatePerDay > 0 ? Math.floor(r.onHand / r.burnRatePerDay) : Infinity;
                  return (
                    <tr key={r.id} className={cn("border-b border-border last:border-0", low && "bg-[hsl(var(--warning))]/5")}>
                      <td className="py-3 px-5">
                        <div className="font-medium">{r.label}</div>
                        <div className="text-xs text-muted-foreground capitalize">{r.category.replace("_", " ")}</div>
                      </td>
                      <td className="py-3 px-2 text-xs">{site?.name || r.siteId}</td>
                      <td className="py-3 px-2 text-right tabular-nums">
                        {r.onHand} <span className="text-xs text-muted-foreground">{r.unit}</span>
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums text-muted-foreground">{r.minStock}</td>
                      <td className="py-3 px-2 text-right tabular-nums text-muted-foreground">{r.burnRatePerDay}</td>
                      <td className="py-3 px-2 text-right">
                        {days === Infinity ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <Badge variant={days < 3 ? "critical" : days < 7 ? "warning" : "muted"}>
                            {days}d
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <div className="inline-flex gap-1">
                          <Button size="icon" variant="outline" onClick={() => adjust(r.id, -10)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => adjust(r.id, 10)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
