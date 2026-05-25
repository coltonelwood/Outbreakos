import { notFound } from "next/navigation";
import { data } from "@/lib/store";
import { requireCapability } from "@/lib/auth";
import { PermissionError } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadsClient } from "./leads-client";
import { Inbox } from "lucide-react";

export default async function LeadsPage() {
  // Owner-only — defense in depth (sidebar already hides for non-owners; this
  // enforces server-side). Non-owners see a 404 rather than a stack trace.
  try {
    requireCapability("lead.read");
  } catch (e) {
    if (e instanceof PermissionError) notFound();
    throw e;
  }
  const leads = await data.leads();
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Inbox className="h-7 w-7 text-primary" /> Inbound leads
          </h1>
          <p className="text-muted-foreground text-sm">
            Every demo request, pilot inquiry, and ROI scenario captured from
            the public site. Owner-only view.
          </p>
        </div>
        <Badge variant="muted">{leads.length} lead{leads.length === 1 ? "" : "s"}</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lead pipeline</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <LeadsClient leads={leads} />
        </CardContent>
      </Card>
    </div>
  );
}
