import { redirect } from "next/navigation";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { DemoBanner } from "@/components/ui/disclaimer";
import { currentUser, getSession, isSessionActive } from "@/lib/auth";
import { data } from "@/lib/store";
import { assertPersistence } from "@/lib/persistence-guard";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Refuse to serve on the in-memory store when REQUIRE_PERSISTENCE=true.
  // The dashboard error boundary renders the PersistenceError cleanly.
  assertPersistence();

  const session = getSession();
  if (!session) redirect("/login");
  // Live revocation/deactivation check against the DB (logout-all, role change,
  // deactivation take effect here on the next request).
  if (!(await isSessionActive(session))) redirect("/login");

  const [user, org] = await Promise.all([currentUser(), data.org(session.orgId)]);
  if (!user || !org) redirect("/login");

  const openAlerts = (await data.alerts(session.orgId)).filter((a) => a.status === "open").length;
  const isDemoOrg = org.id === "org_demo";

  return (
    <div className="flex min-h-screen">
      <Sidebar orgName={org.name} role={user.role} isDemoOrg={isDemoOrg} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          userName={user.name}
          userRole={user.role}
          openAlerts={openAlerts}
          mode={org.mode}
        />
        <div className="p-4 lg:p-6 space-y-4">
          {isDemoOrg && <DemoBanner />}
          {children}
        </div>
      </div>
    </div>
  );
}
