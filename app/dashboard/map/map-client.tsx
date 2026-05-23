"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { OutbreakRegion, Site, CaseRecord, Contact } from "@/lib/types";

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[560px] rounded-md bg-card flex items-center justify-center text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

interface Props {
  regions: OutbreakRegion[];
  sites: Site[];
  cases: CaseRecord[];
  contacts: Contact[];
}

export function MapClient({ regions, sites, cases, contacts }: Props) {
  const [filters, setFilters] = useState({
    confirmed: true,
    suspected: true,
    deaths: true,
    contacts: true,
    facilities: true,
    poe: true,
  });

  const totals = regions.reduce(
    (acc, r) => ({
      c: acc.c + r.confirmed,
      s: acc.s + r.suspected,
      d: acc.d + r.deaths,
      ct: acc.ct + r.contactsMonitored,
    }),
    { c: 0, s: 0, d: 0, ct: 0 },
  );

  const facilitySites = sites.filter((s) => s.kind === "hospital" || s.kind === "clinic" || s.kind === "mine" || s.kind === "field_base");
  const poeSites = sites.filter((s) => s.kind === "airport" || s.kind === "border");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Checkbox checked={filters.confirmed} onCheckedChange={(v) => setFilters({ ...filters, confirmed: v })} label={`Confirmed (${totals.c})`} />
        <Checkbox checked={filters.suspected} onCheckedChange={(v) => setFilters({ ...filters, suspected: v })} label={`Suspected (${totals.s})`} />
        <Checkbox checked={filters.deaths} onCheckedChange={(v) => setFilters({ ...filters, deaths: v })} label={`Deaths (${totals.d})`} />
        <Checkbox checked={filters.contacts} onCheckedChange={(v) => setFilters({ ...filters, contacts: v })} label={`Contacts (${totals.ct})`} />
        <Checkbox checked={filters.facilities} onCheckedChange={(v) => setFilters({ ...filters, facilities: v })} label={`Facilities (${facilitySites.length})`} />
        <Checkbox checked={filters.poe} onCheckedChange={(v) => setFilters({ ...filters, poe: v })} label={`Points of entry (${poeSites.length})`} />
      </div>
      <div className="rounded-lg overflow-hidden border border-border">
        <LeafletMap regions={regions} sites={sites} filters={filters} />
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="critical">High severity</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="muted">Site / point of entry</Badge>
      </div>
    </div>
  );
}
