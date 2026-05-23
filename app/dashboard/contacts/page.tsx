import { data } from "@/lib/store";
import { requireSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { ContactsClient } from "./contacts-client";

export default function ContactsPage() {
  const sess = requireSession();
  const contacts = data.contacts(sess.orgId);
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Contact Monitoring</h1>
          <p className="text-muted-foreground text-sm">
            21-day daily check-ins for contacts linked to operational screenings or cases.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["active", "escalated", "cleared", "lost_to_follow_up"] as const).map((s) => {
          const count = contacts.filter((c) => c.status === s).length;
          return (
            <Card key={s}>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {s.replace(/_/g, " ")}
                </div>
                <div className="mt-2 text-3xl font-bold tabular-nums">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ContactsClient contacts={contacts} />
    </div>
  );
}
