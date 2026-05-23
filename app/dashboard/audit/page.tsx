import { data } from "@/lib/store";
import { requireSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditClient } from "./audit-client";
import { ScrollText } from "lucide-react";

export default function AuditPage() {
  const sess = requireSession();
  const audit = data.audit(sess.orgId);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <ScrollText className="h-7 w-7 text-primary" /> Audit Log
        </h1>
        <p className="text-muted-foreground text-sm">
          Every screening, alert, AI call, resource adjustment, and report generation
          is logged with actor, target, and timestamp.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Events ({audit.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <AuditClient events={audit} />
        </CardContent>
      </Card>
    </div>
  );
}
