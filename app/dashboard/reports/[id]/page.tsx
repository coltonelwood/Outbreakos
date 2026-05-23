import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintButton } from "@/components/app/print-button";
import { Badge } from "@/components/ui/badge";
import { NotADiagnosticBanner } from "@/components/ui/disclaimer";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { RegenerateButton } from "./regenerate-button";

export default function ReportDetail({ params }: { params: { id: string } }) {
  const d = db();
  const r = d.reports.find((x) => x.id === params.id);
  if (!r) notFound();

  return (
    <div className="space-y-4 print-page">
      <div className="flex items-center justify-between gap-3 no-print">
        <Link href="/dashboard/reports" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex gap-2">
          <RegenerateButton kind={r.kind} />
          <PrintButton label="Print / save PDF" />
        </div>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{r.title}</h1>
        <p className="text-sm text-muted-foreground">
          Generated {formatDateTime(r.generatedAt)} · {r.aiAssisted ? "AI-assisted" : "Template-built"} · {d.org.name}
        </p>
      </div>

      <NotADiagnosticBanner />

      <Card>
        <CardHeader><CardTitle>Executive summary</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{r.summary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Key numbers</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {r.keyNumbers.map((k) => (
              <div key={k.label} className="rounded-md border border-border bg-card p-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{k.value}</div>
                {k.delta && <div className="mt-1 text-xs text-muted-foreground">{k.delta}</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Hotspots</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {r.hotspots.map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <Badge variant="warning">·</Badge>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Open risks</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {r.openRisks.map((rk) => (
                <li key={rk} className="flex items-start gap-2">
                  <Badge variant="critical">·</Badge>
                  <span>{rk}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recommended actions</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm list-decimal pl-5">
            {r.recommended.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Changes since last report</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {r.changesSinceLast.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
