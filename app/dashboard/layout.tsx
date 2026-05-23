import { redirect } from "next/navigation";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { DemoBanner } from "@/components/ui/disclaimer";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = currentUser();
  if (!user) {
    redirect("/login");
  }
  const d = db();
  const openAlerts = d.alerts.filter((a) => a.status === "open").length;

  return (
    <div className="flex min-h-screen">
      <Sidebar orgName={d.org.name} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          userName={user.name}
          userRole={user.role}
          openAlerts={openAlerts}
          mode={d.org.mode}
        />
        <div className="p-4 lg:p-6 space-y-4">
          <DemoBanner />
          {children}
        </div>
      </div>
    </div>
  );
}
