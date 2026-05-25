import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskPill } from "@/components/ui/status-pill";
import { data } from "@/lib/store";
import { requireSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { ClipboardCheck } from "lucide-react";

export default async function ScreeningsPage() {
  const sess = requireSession();
  const screenings = await data.screenings(sess.orgId);
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Screenings</h1>
          <p className="text-muted-foreground text-sm">
            Operational triage records — airport, site-entry, and clinic intake.
          </p>
        </div>
        <Link href="/dashboard/screenings/new">
          <Button>
            <ClipboardCheck className="h-4 w-4" /> New screening
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent screenings ({screenings.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {screenings.length === 0 ? (
            <p className="text-sm text-muted-foreground p-5">
              No screenings yet. Run your first one to populate the queue.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-5 font-medium">Subject</th>
                    <th className="text-left py-3 px-2 font-medium">Context</th>
                    <th className="text-left py-3 px-2 font-medium">Origin → Destination</th>
                    <th className="text-left py-3 px-2 font-medium">Created</th>
                    <th className="text-center py-3 px-2 font-medium">Operational tier</th>
                    <th className="text-right py-3 px-5 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {screenings.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="py-3 px-5">
                        <div className="font-medium">{s.subjectName}</div>
                        <div className="text-xs text-muted-foreground">{s.id}</div>
                      </td>
                      <td className="py-3 px-2 capitalize">{s.context.replace("_", " ")}</td>
                      <td className="py-3 px-2 text-xs">
                        <span className="text-muted-foreground">{s.originRegion}, {s.originCountry}</span>
                        <br />
                        <span>→ {s.destination}</span>
                      </td>
                      <td className="py-3 px-2 text-xs text-muted-foreground">{formatDateTime(s.createdAt)}</td>
                      <td className="py-3 px-2 text-center">
                        <RiskPill risk={s.risk} />
                      </td>
                      <td className="py-3 px-5 text-right">
                        <Link href={`/dashboard/screenings/${s.id}`}>
                          <Button variant="ghost" size="sm">Open</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
