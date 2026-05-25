"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  Boxes,
  Brain,
  Building2,
  ClipboardCheck,
  Cog,
  FileText,
  Home,
  Inbox,
  Map,
  Menu,
  ScrollText,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";
import { can } from "@/lib/permissions";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  requires?: Parameters<typeof can>[1];
}

interface NavGroup {
  label: string;
  items: NavItem[];
  internal?: boolean;
}

const groups: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard", label: "Overview", icon: Home },
      { href: "/dashboard/map", label: "Outbreak Map", icon: Map },
      { href: "/dashboard/screenings", label: "Screenings", icon: ClipboardCheck, requires: "screening.read" },
      { href: "/dashboard/contacts", label: "Contact Monitoring", icon: Users, requires: "contact.read" },
      { href: "/dashboard/alerts", label: "Alerts", icon: Bell, requires: "alert.read" },
      { href: "/dashboard/resources", label: "Resources", icon: Boxes, requires: "resource.read" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/dashboard/reports", label: "Situation Reports", icon: FileText, requires: "report.read" },
      { href: "/dashboard/ai", label: "AI Command", icon: Brain, requires: "ai.invoke" },
      { href: "/dashboard/command", label: "Multi-site Command", icon: ShieldAlert },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/dashboard/sites", label: "Sites", icon: Building2, requires: "settings.read" },
      { href: "/dashboard/settings", label: "Settings", icon: Cog, requires: "settings.read" },
      { href: "/dashboard/audit", label: "Audit Log", icon: ScrollText, requires: "audit.read" },
      { href: "/dashboard/leads", label: "Leads", icon: Inbox, requires: "lead.read" },
    ],
  },
  {
    label: "Internal",
    internal: true,
    items: [{ href: "/dashboard/demo-script", label: "Demo Script", icon: Sparkles }],
  },
];

interface Props {
  orgName: string;
  role: Role;
  isDemoOrg: boolean;
}

export function Sidebar({ orgName, role, isDemoOrg }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Filter groups + items based on role and whether internal/demo content is allowed.
  const visibleGroups = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.requires || can(role, i.requires)),
    }))
    .filter((g) => {
      if (g.items.length === 0) return false;
      if (g.internal) {
        // Internal/sales-kit content only for owner/admin and only on the seeded demo org.
        return isDemoOrg && (role === "owner" || role === "admin");
      }
      return true;
    });

  const NavContent = (
    <>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <div className="relative">
              <Activity className="h-5 w-5 text-primary" />
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/30" />
            </div>
            <span className="font-bold">OutbreakOS</span>
          </Link>
          <button
            className="lg:hidden text-muted-foreground"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground truncate">{orgName}</div>
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 space-y-6">
        {visibleGroups.map((g) => (
          <div key={g.label}>
            <div className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {g.label}
            </div>
            <div className="space-y-0.5 px-2">
              {g.items.map((i) => {
                const active = pathname === i.href || pathname.startsWith(i.href + "/");
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <i.icon className="h-4 w-4" />
                    {i.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-border text-[11px] text-muted-foreground">
        <p>Operational health-security platform. Not a medical diagnostic device.</p>
      </div>
    </>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-3 left-3 z-50 rounded-md border border-border bg-card/90 backdrop-blur p-2 text-foreground shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative flex w-64 flex-col bg-card border-r border-border animate-fade-in">
            {NavContent}
          </aside>
        </div>
      )}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-card/40 h-screen sticky top-0">
        {NavContent}
      </aside>
    </>
  );
}
