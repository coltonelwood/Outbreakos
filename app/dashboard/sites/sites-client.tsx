"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plane, Activity, Hospital, Building2, MapPin, Plus, X } from "lucide-react";
import type { ResourceItem, Site } from "@/lib/types";

const siteKindIcons: Record<string, typeof Plane> = {
  airport: Plane,
  border: MapPin,
  hospital: Hospital,
  clinic: Hospital,
  mine: Activity,
  field_base: Building2,
};

export function SitesClient({
  sites: initial,
  resources,
  canCreate,
}: {
  sites: Site[];
  resources: ResourceItem[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [sites, setSites] = useState(initial);
  const [open, setOpen] = useState(false);

  async function create(s: Omit<Site, "id" | "orgId">) {
    const r = await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    if (r.ok) {
      const j = await r.json();
      setSites((arr) => [...arr, j.site]);
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canCreate && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New site
          </Button>
        )}
      </div>
      {sites.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No sites yet. {canCreate ? "Add your first site to get started." : "Ask an admin to add a site."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sites.map((s) => {
            const Icon = siteKindIcons[s.kind] || Building2;
            const siteRes = resources.filter((r) => r.siteId === s.id);
            const lowStock = siteRes.filter((r) => r.onHand < r.minStock).length;
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
                        s.status === "lockdown"
                          ? "critical"
                          : s.status === "monitoring"
                            ? "warning"
                            : "success"
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                  {s.workersPerDay !== undefined && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Throughput / day</span>
                      <span className="font-medium tabular-nums">
                        {s.workersPerDay.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Tracked resources</span>
                    <span className="font-medium tabular-nums">{siteRes.length}</span>
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
      )}

      {open && <NewSiteModal onCreate={create} onClose={() => setOpen(false)} />}
    </div>
  );
}

function NewSiteModal({
  onCreate,
  onClose,
}: {
  onCreate: (s: Omit<Site, "id" | "orgId">) => void;
  onClose: () => void;
}) {
  const [s, setS] = useState<Omit<Site, "id" | "orgId">>({
    name: "",
    kind: "mine",
    country: "",
    region: "",
    lat: 0,
    lng: 0,
    workersPerDay: 0,
    status: "active",
  });
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Add a site</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreate(s);
          }}
          className="space-y-3"
        >
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Site name">
              <Input value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} required />
            </Field>
            <Field label="Kind">
              <Select value={s.kind} onChange={(e) => setS({ ...s, kind: e.target.value as Site["kind"] })}>
                <option value="mine">Mining / industrial site</option>
                <option value="airport">Airport</option>
                <option value="border">Border post</option>
                <option value="hospital">Hospital</option>
                <option value="clinic">Clinic</option>
                <option value="field_base">Field base</option>
              </Select>
            </Field>
            <Field label="Country">
              <Input value={s.country} onChange={(e) => setS({ ...s, country: e.target.value })} required />
            </Field>
            <Field label="Region / district">
              <Input value={s.region} onChange={(e) => setS({ ...s, region: e.target.value })} required />
            </Field>
            <Field label="Latitude">
              <Input
                type="number"
                step="0.0001"
                value={s.lat}
                onChange={(e) => setS({ ...s, lat: Number(e.target.value) })}
                required
              />
            </Field>
            <Field label="Longitude">
              <Input
                type="number"
                step="0.0001"
                value={s.lng}
                onChange={(e) => setS({ ...s, lng: Number(e.target.value) })}
                required
              />
            </Field>
            <Field label="Throughput / day">
              <Input
                type="number"
                value={s.workersPerDay ?? 0}
                onChange={(e) => setS({ ...s, workersPerDay: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Status">
              <Select
                value={s.status}
                onChange={(e) => setS({ ...s, status: e.target.value as Site["status"] })}
              >
                <option value="active">Active</option>
                <option value="monitoring">Monitoring</option>
                <option value="lockdown">Lockdown</option>
              </Select>
            </Field>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create site</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
