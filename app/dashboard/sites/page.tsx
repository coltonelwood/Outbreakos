import { data } from "@/lib/store";
import { currentUser, requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { SitesClient } from "./sites-client";

export default async function SitesPage() {
  const sess = requireSession();
  const [user, sites, resources] = await Promise.all([
    currentUser(), data.sites(sess.orgId), data.resources(sess.orgId),
  ]);

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
        canCreate={can(user!.role, "site.create")}
      />
    </div>
  );
}
