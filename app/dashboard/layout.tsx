import { redirect } from "next/navigation";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { DemoBanner } from "@/components/ui/disclaimer";
import { currentUser, getSession } from "@/lib/auth";
import { data } from "@/lib/store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  const user = currentUser();
  if (!session || !user) redirect("/login");

  const org = data.org(session.orgId);
  if (!org) redirect("/login");

  const openAlerts = data.alerts(session.orgId).filter((a) => a.status === "open").length;
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
