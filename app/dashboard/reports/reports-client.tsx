"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, Plane, Activity, HeartHandshake, Building2 } from "lucide-react";
import type { ReportKind, SitRep } from "@/lib/types";

const REPORT_KINDS: { kind: ReportKind; label: string; icon: typeof FileText; description: string }[] = [
  { kind: "daily_sitrep", label: "Daily SITREP", icon: FileText, description: "Yesterday and today, in one document." },
  { kind: "exec_briefing", label: "Executive Briefing", icon: Sparkles, description: "Board / minister-ready summary." },
  { kind: "airport_screening", label: "Airport Screening", icon: Plane, description: "Throughput, flags, escalations." },
  { kind: "mining_workforce", label: "Mining Workforce", icon: Activity, description: "Site-level workforce health log." },
  { kind: "ngo_donor", label: "NGO Donor Report", icon: HeartHandshake, description: "Reach, impact, spend signals." },
];

export function ReportsClient({ existingReports }: { existingReports: SitRep[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<ReportKind | null>(null);

  async function generate(kind: ReportKind) {
    setBusy(kind);
    const r = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    const j = await r.json();
    setBusy(null);
    if (r.ok && j.report) {
      router.push(`/dashboard/reports/${j.report.id}`);
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate a new report</CardTitle>
        <p className="text-xs text-muted-foreground">
          Reports use live data; AI assistance enriches narrative when a provider key is configured.
          Deterministic templates ensure reports always generate.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {REPORT_KINDS.map((r) => (
            <button
              key={r.kind}
              onClick={() => generate(r.kind)}
              disabled={busy !== null}
              className="text-left rounded-lg border border-border bg-card/40 hover:bg-card/60 hover:border-primary/40 transition-colors p-4 disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <r.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{r.label}</div>
                  <div className="text-xs text-muted-foreground">{r.description}</div>
                </div>
              </div>
              {busy === r.kind && <div className="mt-3 text-xs text-primary">Generating…</div>}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
