"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Mail } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Lead {
  id: string;
  email: string;
  name?: string;
  org?: string;
  role?: string;
  audience?: string;
  intent?: string;
  message?: string;
  source: string;
  createdAt: string;
}

export function LeadsClient({ leads: initial }: { leads: Lead[] }) {
  const [q, setQ] = useState("");
  const [intent, setIntent] = useState<string>("all");

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return initial.filter((l) => {
      if (intent !== "all" && l.intent !== intent) return false;
      if (!term) return true;
      return [l.email, l.name, l.org, l.message]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term));
    });
  }, [initial, q, intent]);

  const intents = Array.from(new Set(initial.map((l) => l.intent).filter(Boolean))) as string[];

  function exportCsv() {
    const rows = [
      ["id", "created_at", "email", "name", "org", "role", "audience", "intent", "source", "message"],
      ...filtered.map((l) => [
        l.id,
        l.createdAt,
        l.email,
        l.name || "",
        l.org || "",
        l.role || "",
        l.audience || "",
        l.intent || "",
        l.source,
        (l.message || "").replace(/[\r\n,]/g, " "),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="p-4 flex flex-wrap items-center gap-2 border-b border-border">
        <Input
          placeholder="Search by email, name, org, message…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-md"
        />
        <select
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          className="h-10 rounded-md border border-input bg-input/60 px-3 text-sm"
        >
          <option value="all">All intents</option>
          {intents.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {initial.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">
          No leads yet — they'll appear here as visitors submit the contact form, request a pilot, or save an ROI scenario.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
              <tr>
                <th className="text-left py-2 px-5 font-medium">Received</th>
                <th className="text-left py-2 px-2 font-medium">Email</th>
                <th className="text-left py-2 px-2 font-medium">Org</th>
                <th className="text-left py-2 px-2 font-medium">Intent</th>
                <th className="text-left py-2 px-2 font-medium">Audience</th>
                <th className="text-left py-2 px-2 font-medium">Source</th>
                <th className="text-left py-2 px-5 font-medium">Message</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/30 align-top">
                  <td className="py-3 px-5 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(l.createdAt)}
                  </td>
                  <td className="py-3 px-2">
                    <a
                      href={`mailto:${l.email}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Mail className="h-3 w-3" /> {l.email}
                    </a>
                    {l.name && <div className="text-xs text-muted-foreground">{l.name}</div>}
                  </td>
                  <td className="py-3 px-2">{l.org || "—"}</td>
                  <td className="py-3 px-2">
                    {l.intent ? <Badge variant="muted">{l.intent}</Badge> : "—"}
                  </td>
                  <td className="py-3 px-2">{l.audience || "—"}</td>
                  <td className="py-3 px-2 text-xs">{l.source}</td>
                  <td className="py-3 px-5 text-xs text-muted-foreground max-w-md">
                    {l.message ? l.message.slice(0, 240) : "—"}
                    {l.message && l.message.length > 240 ? "…" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
