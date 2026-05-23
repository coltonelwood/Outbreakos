import Link from "next/link";
import { db } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportsClient } from "./reports-client";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function ReportsPage() {
  const d = db();
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Situation Reports</h1>
          <p className="text-muted-foreground text-sm">
            Daily SITREPs, executive briefings, airport screening reports,
            mining workforce reports, and donor reports.
          </p>
        </div>
      </div>

      <ReportsClient existingReports={d.reports} />

      <Card>
        <CardHeader><CardTitle>Recent reports</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {d.reports.map((r) => (
              <li key={r.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(r.generatedAt)} · {r.aiAssisted ? "AI-assisted" : "Template-built"}
                  </div>
                </div>
                <Link href={`/dashboard/reports/${r.id}`}>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4" /> Open
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
