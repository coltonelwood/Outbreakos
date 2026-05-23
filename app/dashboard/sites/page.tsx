import { data } from "@/lib/store";
import { currentUser, requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { SitesClient } from "./sites-client";

export default function SitesPage() {
  const sess = requireSession();
  const user = currentUser()!;
  const sites = data.sites(sess.orgId);
  const resources = data.resources(sess.orgId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Sites</h1>
        <p className="text-muted-foreground text-sm">
          All sites under this organization. Each site has its own screening lanes,
          resources, and alerts.
        </p>
      </div>
      <SitesClient
        sites={sites}
        resources={resources}
        canCreate={can(user.role, "site.create")}
      />
    </div>
  );
}
