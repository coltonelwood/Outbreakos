import { db } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { ScrollText } from "lucide-react";

export default function AuditPage() {
  const d = db();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <ScrollText className="h-7 w-7 text-primary" /> Audit Log
        </h1>
        <p className="text-muted-foreground text-sm">
          Every screening, alert, AI call, resource adjustment, and report
          generation is logged with actor, target, and timestamp.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent events ({d.audit.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
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
                {d.audit.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-2 px-5 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(a.createdAt)}</td>
                    <td className="py-2 px-2"><code className="text-xs">{a.actor}</code></td>
                    <td className="py-2 px-2"><span className="font-medium">{a.action}</span></td>
                    <td className="py-2 px-2"><code className="text-xs text-primary">{a.target}</code></td>
                    <td className="py-2 px-5 text-xs text-muted-foreground font-mono truncate max-w-xs">
                      {a.meta ? JSON.stringify(a.meta) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
