"use client";

import Link from "next/link";
import { Activity, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/solutions", label: "Solutions" },
  { href: "/airports", label: "Airports" },
  { href: "/mining", label: "Mining & Industrial" },
  { href: "/hospitals", label: "Hospitals & Clinics" },
  { href: "/government", label: "Governments & NGOs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/compliance", label: "Compliance" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="relative">
            <Activity className="h-6 w-6 text-primary" />
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/30" />
          </div>
          <span>OutbreakOS</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:inline-block">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="sm">Request demo</Button>
          </Link>
          <button
            className="lg:hidden text-muted-foreground"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className={cn("lg:hidden border-t border-border bg-background")}>
          <div className="container py-3 flex flex-col gap-1">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="px-3 py-2 text-sm">
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
