"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown, Bell as BellIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopbarProps {
  userName: string;
  userRole: string;
  openAlerts: number;
  mode: string;
}

export function Topbar({ userName, userRole, openAlerts, mode }: TopbarProps) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const modeLabels: Record<string, string> = {
    standard: "Standard",
    airport_poe: "Airport PoE Mode",
    mining_site: "Mining Site Mode",
    gov_emergency: "Government Emergency Ops",
    ngo_field: "NGO Field Response",
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            <span className="font-medium">LIVE</span>
          </div>
          <Badge variant="muted" className="hidden sm:inline-flex">
            <Sparkles className="h-3 w-3 mr-1" />
            {modeLabels[mode] || mode}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/alerts" className="relative">
            <Button variant="ghost" size="icon" aria-label="Alerts">
              <BellIcon className="h-5 w-5" />
              {openAlerts > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                  {openAlerts}
                </span>
              )}
            </Button>
          </Link>
          <div className="hidden md:flex items-center gap-2 rounded-md border border-border px-3 py-1.5">
            <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">
              {userName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div className="text-xs">
              <div className="font-medium">{userName}</div>
              <div className="text-muted-foreground capitalize">{userRole.replace("_", " ")}</div>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
