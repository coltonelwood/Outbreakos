"use client";

import { MapContainer, TileLayer, Circle, Popup, Marker } from "react-leaflet";
import L from "leaflet";
import type { OutbreakRegion, Site } from "@/lib/types";

const severityColors: Record<string, string> = {
  info: "#38bdf8",
  warning: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

function makeIcon(color: string, label: string) {
  return L.divIcon({
    className: "outbreakos-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};
      border:2px solid #0a1428;
      display:flex;align-items:center;justify-content:center;
      color:#0a1428;font-weight:700;font-size:11px;
      box-shadow:0 0 12px ${color}cc;
    ">${label}</div>`,
  });
}

const ICONS = {
  airport: makeIcon("#38bdf8", "A"),
  border: makeIcon("#a78bfa", "B"),
  hospital: makeIcon("#22c55e", "H"),
  clinic: makeIcon("#22c55e", "C"),
  mine: makeIcon("#f59e0b", "M"),
  field_base: makeIcon("#94a3b8", "F"),
};

interface Filters {
  confirmed: boolean;
  suspected: boolean;
  deaths: boolean;
  contacts: boolean;
  facilities: boolean;
  poe: boolean;
}

export default function LeafletMap({
  regions,
  sites,
  filters,
}: {
  regions: OutbreakRegion[];
  sites: Site[];
  filters: Filters;
}) {
  const center: [number, number] = [0.5, 30.0];
  return (
    <MapContainer
      center={center}
      zoom={6}
      style={{ height: "560px", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {regions.map((r) => {
        const color = severityColors[r.severity];
        return (
          <Circle
            key={r.id}
            center={[r.lat, r.lng]}
            radius={r.radiusKm * 1000}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.18, weight: 1.5 }}
          >
            <Popup>
              <div className="space-y-1">
                <strong>{r.name}</strong>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>{r.country}</div>
                {filters.confirmed && <div>Confirmed: {r.confirmed}</div>}
                {filters.suspected && <div>Suspected: {r.suspected}</div>}
                {filters.deaths && <div>Deaths: {r.deaths}</div>}
                {filters.contacts && <div>Contacts monitored: {r.contactsMonitored}</div>}
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  Severity: {r.severity} · Trend: {r.trend}
                </div>
              </div>
            </Popup>
          </Circle>
        );
      })}
      {sites.map((s) => {
        const isPoe = s.kind === "airport" || s.kind === "border";
        if (isPoe && !filters.poe) return null;
        if (!isPoe && !filters.facilities) return null;
        return (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={ICONS[s.kind as keyof typeof ICONS] || ICONS.field_base}
          >
            <Popup>
              <div>
                <strong>{s.name}</strong>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>
                  {s.kind.replace("_", " ")} · {s.country} / {s.region}
                </div>
                <div style={{ marginTop: 4 }}>Status: {s.status}</div>
                {s.workersPerDay !== undefined && (
                  <div>Throughput: ~{s.workersPerDay.toLocaleString()} / day</div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
