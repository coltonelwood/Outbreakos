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
  Map,
  Menu,
  ScrollText,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard", label: "Overview", icon: Home },
      { href: "/dashboard/map", label: "Outbreak Map", icon: Map },
      { href: "/dashboard/screenings", label: "Screenings", icon: ClipboardCheck },
      { href: "/dashboard/contacts", label: "Contact Monitoring", icon: Users },
      { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
      { href: "/dashboard/resources", label: "Resources", icon: Boxes },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/dashboard/reports", label: "Situation Reports", icon: FileText },
      { href: "/dashboard/ai", label: "AI Command", icon: Brain },
      { href: "/dashboard/command", label: "Multi-site Command", icon: ShieldAlert },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/dashboard/sites", label: "Sites", icon: Building2 },
      { href: "/dashboard/settings", label: "Settings", icon: Cog },
      { href: "/dashboard/audit", label: "Audit Log", icon: ScrollText },
    ],
  },
  {
    label: "Sales kit",
    items: [
      { href: "/dashboard/demo-script", label: "Demo Script", icon: ShieldAlert },
    ],
  },
];

export function Sidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = (
    <>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
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
        {groups.map((g) => (
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
        <p>OutbreakOS is an operational platform, not a medical diagnostic device.</p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile trigger — fixed to the top-left, visible only on small screens */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 rounded-md border border-border bg-card/90 backdrop-blur p-2 text-foreground shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
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

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-card/40 h-screen sticky top-0">
        {NavContent}
      </aside>
    </>
  );
}
