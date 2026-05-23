import Link from "next/link";
import { Activity } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <Activity className="h-5 w-5 text-primary" />
              <span>OutbreakOS</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Outbreak intelligence, screening, contact monitoring, and executive
              reporting for airports, mining, hospitals, NGOs, and governments.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              OutbreakOS is not a medical diagnostic device. It supports
              operational workflows; clinical decisions are made by qualified
              health authorities.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold mb-3">Solutions</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/airports" className="hover:text-foreground">Airports</Link></li>
              <li><Link href="/mining" className="hover:text-foreground">Mining</Link></li>
              <li><Link href="/hospitals" className="hover:text-foreground">Hospitals</Link></li>
              <li><Link href="/government" className="hover:text-foreground">Government & NGO</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold mb-3">Company</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="/security" className="hover:text-foreground">Security</Link></li>
              <li><Link href="/compliance" className="hover:text-foreground">Compliance</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold mb-3">Product</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-foreground">Sign in</Link></li>
              <li><Link href="/signup" className="hover:text-foreground">Get started</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground">Open demo</Link></li>
              <li><Link href="/roi" className="hover:text-foreground">ROI calculator</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} OutbreakOS. All rights reserved.</p>
          <p>
            Operational support platform — not a diagnostic tool. Follow WHO,
            CDC, and local ministry of health guidance.
          </p>
        </div>
      </div>
    </footer>
  );
}
