import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  Boxes,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Globe2,
  Hospital,
  Map,
  Plane,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="relative">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg" aria-hidden />
        <div className="absolute inset-0 gradient-mesh" aria-hidden />
        <div className="container relative py-24 lg:py-32">
          <div className="flex items-center gap-2 text-xs font-medium text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-powered outbreak operations command center</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl leading-[1.05]">
            Run an outbreak response like a{" "}
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              command center.
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
            Real-time screening, contact monitoring, resource logistics, and
            executive briefings — for airports, mining sites, hospitals, NGOs,
            and government response teams.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button size="lg">
                Open live demo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Request executive briefing
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground max-w-xl">
            OutbreakOS is an operations and intelligence platform. It is not a
            medical diagnostic device and does not determine infection status.
          </p>

          {/* Hero glance */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
            {[
              { label: "Screenings / day", value: "1.8K+" },
              { label: "Contacts monitored", value: "374" },
              { label: "Sites coordinated", value: "6" },
              { label: "Avg. SITREP time", value: "< 90s" },
            ].map((s) => (
              <div key={s.label} className="rounded-md border border-border bg-card/40 backdrop-blur p-4">
                <div className="text-2xl font-bold tabular-nums">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="container py-20 lg:py-28">
        <div className="max-w-3xl">
          <p className="text-sm text-primary font-medium uppercase tracking-wider">
            One platform · Eleven modules
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold">
            Every move of a response, on one screen.
          </h2>
          <p className="mt-3 text-muted-foreground">
            From the first symptom flag at an airport gate to the briefing your
            minister reads at 7am.
          </p>
        </div>
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Globe2, title: "Outbreak intelligence", text: "Live region map, case clusters, severity, trend tracking." },
            { icon: ClipboardCheck, title: "Screening workflows", text: "Airport, site-entry, clinic intake — risk-tiered actions." },
            { icon: Users, title: "Contact monitoring", text: "21-day timeline, SMS/WhatsApp check-ins, escalation." },
            { icon: Bell, title: "Alerts center", text: "High-risk screening, missed check-ins, cluster surges, low stock." },
            { icon: Boxes, title: "Resource logistics", text: "PPE, sample kits, isolation beds, staff availability, vehicles." },
            { icon: Brain, title: "AI command assistant", text: "Briefings, stakeholder drafts, resource requests, risk explanations." },
            { icon: TrendingUp, title: "Situation reports", text: "Daily SITREPs, exec briefings, airport / mining / donor variants." },
            { icon: Map, title: "Multi-site command view", text: "All sites, all corridors, one operational picture." },
            { icon: Shield, title: "Security & compliance", text: "RBAC, audit logs, RLS-ready schema, privacy by design." },
          ].map((m) => (
            <Card key={m.title} className="hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    <m.icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{m.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{m.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* AUDIENCES */}
      <section className="border-t border-border bg-card/30">
        <div className="container py-20 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm text-primary font-medium uppercase tracking-wider">
              Built for the people running the response
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold">
              Four operating modes, one platform.
            </h2>
          </div>
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Plane,
                title: "Airport Point-of-Entry Mode",
                points: ["Traveler screening lanes", "Gate-level escalation", "Inbound risk-corridor flags", "Health-authority handover"],
                href: "/airports",
              },
              {
                icon: Activity,
                title: "Mining Site Protection Mode",
                points: ["Worker entry screening", "Rotation health log", "Site lockdown playbook", "Continuity protection"],
                href: "/mining",
              },
              {
                icon: Hospital,
                title: "Hospitals & Clinics",
                points: ["Clinic intake risk tiering", "Isolation bed status", "PPE burn rate alerts", "Lab sample tracking"],
                href: "/hospitals",
              },
              {
                icon: Globe2,
                title: "Government & NGO",
                points: ["Cross-border coordination", "Donor / ministry reporting", "Field response logistics", "Executive dashboards"],
                href: "/government",
              },
            ].map((a) => (
              <Card key={a.title} className="flex flex-col">
                <CardHeader>
                  <div className="rounded-md bg-primary/10 p-2 w-fit text-primary">
                    <a.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-3">{a.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-2 text-sm text-muted-foreground flex-1">
                    {a.points.map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={a.href} className="text-primary text-sm mt-4 inline-flex items-center gap-1 hover:underline">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 lg:py-28">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-10 lg:p-16 relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-50" aria-hidden />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold">
              Stand up an operations center in 72 hours.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Emergency deployment package gets a fully configured OutbreakOS
              tenant, branded SITREPs, screening lanes, and contact monitoring
              live in under three days.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact">
                <Button size="lg">Talk to deployment team</Button>
              </Link>
              <Link href="/roi">
                <Button size="lg" variant="outline">
                  Run ROI calculator
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
