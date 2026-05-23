"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select } from "@/components/ui/input";
import { ClipboardList, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResourceItem, Site } from "@/lib/types";

type Reason = "received" | "consumed" | "correction" | "transfer" | "reorder_request";

interface AdjustState {
  resource: ResourceItem;
  delta: number;
  reason: Reason;
  reference: string;
}

export function ResourcesClient({
  resources: initial,
  sites,
}: {
  resources: ResourceItem[];
  sites: Site[];
}) {
  const router = useRouter();
  const [resources, setResources] = useState(initial);
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [forecast, setForecast] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdjustState | null>(null);

  async function submitAdjust() {
    if (!editing) return;
    const r = await fetch(`/api/resources/${editing.resource.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        delta: editing.delta,
        reason: editing.reason,
        reference: editing.reference || undefined,
      }),
    });
    if (r.ok) {
      const j = await r.json();
      setResources((arr) => arr.map((x) => (x.id === editing.resource.id ? j.resource : x)));
      setEditing(null);
      router.refresh();
    }
  }

  async function generateForecast() {
    const r = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "resource_request",
        user: "Generate a 7-day resource forecast with reorder recommendations.",
      }),
    });
    const j = await r.json();
    setForecast(j.text);
  }

  function exportCsv() {
    const rows = [
      ["id", "site_id", "category", "label", "on_hand", "min_stock", "burn_per_day", "unit"],
      ...resources.map((r) => [
        r.id,
        r.siteId,
        r.category,
        r.label,
        r.onHand,
        r.minStock,
        r.burnRatePerDay,
        r.unit,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resources-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered =
    siteFilter === "all" ? resources : resources.filter((r) => r.siteId === siteFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setSiteFilter("all")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium",
              siteFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
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
                siteFilter === s.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={generateForecast}>
            <ClipboardList className="h-4 w-4" /> AI forecast
          </Button>
        </div>
      </div>

      {forecast && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">AI resource forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">
              {forecast}
            </pre>
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
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-5">No items tracked at this site yet.</p>
          ) : (
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
                    const days =
                      r.burnRatePerDay > 0 ? Math.floor(r.onHand / r.burnRatePerDay) : Infinity;
                    return (
                      <tr
                        key={r.id}
                        className={cn(
                          "border-b border-border last:border-0",
                          low && "bg-[hsl(var(--warning))]/5",
                        )}
                      >
                        <td className="py-3 px-5">
                          <div className="font-medium">{r.label}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {r.category.replace("_", " ")}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-xs">{site?.name || r.siteId}</td>
                        <td className="py-3 px-2 text-right tabular-nums">
                          {r.onHand} <span className="text-xs text-muted-foreground">{r.unit}</span>
                        </td>
                        <td className="py-3 px-2 text-right tabular-nums text-muted-foreground">
                          {r.minStock}
                        </td>
                        <td className="py-3 px-2 text-right tabular-nums text-muted-foreground">
                          {r.burnRatePerDay}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {days === Infinity ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <Badge
                              variant={days < 3 ? "critical" : days < 7 ? "warning" : "muted"}
                            >
                              {days}d
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-5 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setEditing({
                                resource: r,
                                delta: 0,
                                reason: "received",
                                reference: "",
                              })
                            }
                          >
                            Adjust
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Adjust {editing.resource.label}</h3>
              <button
                onClick={() => setEditing(null)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Current: {editing.resource.onHand} {editing.resource.unit}. Every adjustment is
              audited.
            </p>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select
                value={editing.reason}
                onChange={(e) =>
                  setEditing({ ...editing, reason: e.target.value as Reason })
                }
              >
                <option value="received">Received delivery (+)</option>
                <option value="consumed">Consumed (−)</option>
                <option value="correction">Correction</option>
                <option value="transfer">Transfer (−)</option>
                <option value="reorder_request">Reorder request (no count change)</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={editing.delta}
                onChange={(e) =>
                  setEditing({ ...editing, delta: Number(e.target.value) || 0 })
                }
                placeholder="Use negative numbers for consumption/transfer"
              />
            </div>
            <div className="space-y-2">
              <Label>Reference (PO #, supplier, transfer destination)</Label>
              <Input
                value={editing.reference}
                onChange={(e) => setEditing({ ...editing, reference: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={submitAdjust} disabled={editing.delta === 0 && editing.reason !== "reorder_request"}>
                Save adjustment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
