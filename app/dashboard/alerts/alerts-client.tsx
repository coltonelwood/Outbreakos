"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { AlertStatusPill, SeverityPill } from "@/components/ui/status-pill";
import { relativeTime } from "@/lib/utils";
import { Plus, CheckCircle2, Eye, XCircle } from "lucide-react";
import type { Alert, Profile } from "@/lib/types";

export function AlertsClient({ alerts: initial, users }: { alerts: Alert[]; users: Profile[] }) {
  const router = useRouter();
  const [alerts, setAlerts] = useState(initial);
  const [filter, setFilter] = useState<"all" | "open" | "ack" | "resolved">("all");
  const [showCreate, setShowCreate] = useState(false);

  async function updateStatus(id: string, status: Alert["status"]) {
    const r = await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      setAlerts((a) => a.map((x) => (x.id === id ? { ...x, status } : x)));
      router.refresh();
    }
  }

  async function createAlert(form: { title: string; description: string; severity: Alert["severity"]; category: Alert["category"] }) {
    const r = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await r.json();
    if (r.ok && j.alert) {
      setAlerts((a) => [j.alert, ...a]);
      setShowCreate(false);
      router.refresh();
    }
  }

  const filtered = alerts.filter((a) => filter === "all" || a.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {(["all", "open", "ack", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
                (filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground")
              }
            >
              {f}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4" /> New alert
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader><CardTitle>Create alert</CardTitle></CardHeader>
          <CardContent>
            <CreateAlertForm onCreate={createAlert} onCancel={() => setShowCreate(false)} />
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map((a) => (
          <Card key={a.id} className={a.status === "open" && (a.severity === "critical" || a.severity === "high") ? "border-destructive/40" : ""}>
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{a.title}</h3>
                  <SeverityPill severity={a.severity} />
                  <AlertStatusPill status={a.status} />
                  <span className="text-xs text-muted-foreground">{a.category.replace(/_/g, " ")}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {relativeTime(a.createdAt)} {a.owner && `· owner: ${a.owner}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {a.status === "open" && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "ack")}>
                    <Eye className="h-4 w-4" /> Acknowledge
                  </Button>
                )}
                {a.status !== "resolved" && (
                  <Button size="sm" variant="success" onClick={() => updateStatus(a.id, "resolved")}>
                    <CheckCircle2 className="h-4 w-4" /> Resolve
                  </Button>
                )}
                {a.status === "resolved" && (
                  <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, "open")}>
                    <XCircle className="h-4 w-4" /> Reopen
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No alerts in this view.</p>
        )}
      </div>
    </div>
  );
}

function CreateAlertForm({
  onCreate,
  onCancel,
}: {
  onCreate: (a: { title: string; description: string; severity: Alert["severity"]; category: Alert["category"] }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Alert["severity"]>("warning");
  const [category, setCategory] = useState<Alert["category"]>("manual");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCreate({ title, description, severity, category });
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} required />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Severity</Label>
          <Select value={severity} onChange={(e) => setSeverity(e.target.value as Alert["severity"])}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category} onChange={(e) => setCategory(e.target.value as Alert["category"])}>
            <option value="manual">Manual</option>
            <option value="high_risk_screening">High-risk screening</option>
            <option value="missed_checkin">Missed contact check-in</option>
            <option value="cluster_increase">Cluster increase</option>
            <option value="ppe_low_stock">PPE low stock</option>
            <option value="border_risk">Border / airport risk</option>
            <option value="lab_pending">Lab result pending</option>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Create</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
