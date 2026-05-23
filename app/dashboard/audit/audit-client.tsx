"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { AuditEvent } from "@/lib/types";

export function AuditClient({ events }: { events: AuditEvent[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const PAGE = 25;

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    if (!term) return events;
    return events.filter(
      (e) =>
        e.actor.toLowerCase().includes(term) ||
        e.action.toLowerCase().includes(term) ||
        e.target.toLowerCase().includes(term),
    );
  }, [events, q]);

  const paged = filtered.slice(page * PAGE, (page + 1) * PAGE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));

  function exportCsv() {
    const rows = [
      ["id", "created_at", "actor", "action", "target", "meta"],
      ...filtered.map((e) => [
        e.id,
        e.createdAt,
        e.actor,
        e.action,
        e.target,
        JSON.stringify(e.meta || {}),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="p-4 flex flex-wrap items-center gap-2 border-b border-border">
        <Input
          placeholder="Search by actor, action, or target…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          className="max-w-md"
        />
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} event(s)
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
            <tr>
              <th className="text-left py-2 px-5 font-medium">Time</th>
              <th className="text-left py-2 px-2 font-medium">Actor</th>
              <th className="text-left py-2 px-2 font-medium">Action</th>
              <th className="text-left py-2 px-2 font-medium">Target</th>
              <th className="text-left py-2 px-5 font-medium">Meta</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="py-2 px-5 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateTime(a.createdAt)}
                </td>
                <td className="py-2 px-2"><code className="text-xs">{a.actor}</code></td>
                <td className="py-2 px-2"><span className="font-medium">{a.action}</span></td>
                <td className="py-2 px-2">
                  <code className="text-xs text-primary">{a.target}</code>
                </td>
                <td className="py-2 px-5 text-xs text-muted-foreground font-mono truncate max-w-xs">
                  {a.meta ? JSON.stringify(a.meta) : "—"}
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                  No events match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border">
        <span>
          Page {page + 1} / {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
