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
            <span>Operational health-security infrastructure</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl leading-[1.05]">
            Protect your workforce.{" "}
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Protect your operations.
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
            OutbreakOS is the operations platform for mining, industrial, airport,
            and government teams running screening, contact monitoring, resource
            logistics, and executive reporting in high-risk environments.
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
                Request pilot conversation
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground max-w-xl">
            Operational workflow platform. Not a medical diagnostic device. Does
            not determine infection status. Clinical decisions are made by
            qualified health authorities.
          </p>

          {/* Hero glance — labelled as demo scenario, not as customer outcomes */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
            {[
              { label: "Modules", value: "10+" },
              { label: "Operating modes", value: "5" },
              { label: "Avg SITREP draft time", value: "< 90s" },
              { label: "Time to first signed pilot", value: "72h" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-md border border-border bg-card/40 backdrop-blur p-4"
              >
                <div className="text-2xl font-bold tabular-nums">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MINING-FIRST WEDGE */}
      <section className="border-t border-border bg-card/30">
        <div className="container py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Built first for mining & industrial
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold">
                A shutdown costs millions. Your platform should never be the
                reason you take one.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Remote sites, cross-border worker rotations, and continuity-of-operations
                risk demand a system that lives on the operational side of the
                clinical line. OutbreakOS gives mining operators screening lanes
                at site entry, daily check-ins for returning rotations, PPE and
                sample-kit logistics, and exec-grade SITREPs without ever
                claiming to diagnose disease.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {[
                  "Site-entry screening with explainable operational tier",
                  "Daily check-ins for returning rotations from active regions",
                  "PPE / sample-kit logistics with days-of-cover and reorder workflow",
                  "Branded SITREPs for site managers, HSE, and the corporate board",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-3">
                <Link href="/mining">
                  <Button size="lg">
                    Mining playbook <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/roi">
                  <Button size="lg" variant="outline">
                    Run continuity ROI
                  </Button>
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-wider text-primary">Why mining first</p>
              <h3 className="mt-2 text-xl font-semibold">
                Continuity value, not outbreak panic.
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Mining operators have a CFO who knows what one day of unplanned
                shutdown costs. They have HSE leaders fluent in operational
                process. And they operate in regions where outbreak risk is not
                hypothetical. That's why we lead with them.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Model your own continuity value with the ROI calculator. Estimates only — every operation's numbers are different.
              </p>
              <Link href="/roi" className="inline-block mt-3">
                <Button variant="outline" size="sm">
                  Open ROI calculator
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="container py-20 lg:py-28">
        <div className="max-w-3xl">
          <p className="text-sm text-primary font-medium uppercase tracking-wider">
            One platform · Ten modules
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold">
            Every move of an operation, on one screen.
          </h2>
          <p className="mt-3 text-muted-foreground">
            From the first symptom flag at site entry to the briefing your CEO or
            minister reads at 7am.
          </p>
        </div>
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Globe2, title: "Health-security intelligence", text: "Live region map, severity, trend tracking, risk corridors." },
            { icon: ClipboardCheck, title: "Screening workflows", text: "Airport, site-entry, clinic intake — operational risk tiers." },
            { icon: Users, title: "Contact monitoring", text: "21-day daily check-ins, SMS / WhatsApp templates, escalation." },
            { icon: Bell, title: "Alerts center", text: "High-tier screenings, missed check-ins, low stock, border surges." },
            { icon: Boxes, title: "Resource logistics", text: "PPE, sample kits, isolation beds, staff, vehicles — days-of-cover view." },
            { icon: Brain, title: "AI command assistant", text: "Briefings, stakeholder drafts, resource requests — with citations." },
            { icon: TrendingUp, title: "Situation reports", text: "Daily SITREPs, exec briefings, point-of-entry / workforce / donor variants." },
            { icon: Map, title: "Multi-site command view", text: "All sites, all corridors, one operational picture." },
            { icon: Shield, title: "Security & audit", text: "RBAC, signed sessions, audit log on every action, RLS-ready schema." },
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
              Built for the teams running the operation
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold">
              Mining first. Adjacent verticals next.
            </h2>
          </div>
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Activity,
                title: "Mining & Industrial",
                points: ["Site-entry screening", "Rotation health log", "Continuity playbook", "Board-grade reporting"],
                href: "/mining",
                primary: true,
              },
              {
                icon: Plane,
                title: "Airports & Borders",
                points: ["Traveler screening lanes", "Gate-level escalation", "Corridor surveillance", "Health-authority handover"],
                href: "/airports",
              },
              {
                icon: Hospital,
                title: "Hospitals & District Health",
                points: ["Intake operational tiering", "Isolation bed status", "PPE burn rate", "Lab queue tracking"],
                href: "/hospitals",
              },
              {
                icon: Globe2,
                title: "Government & NGO",
                points: ["Cross-border coordination", "Donor / ministry reporting", "Field response logistics", "After-action reviews"],
                href: "/government",
              },
            ].map((a) => (
              <Card
                key={a.title}
                className={
                  "flex flex-col " +
                  (a.primary ? "border-primary/60 shadow-lg shadow-primary/10" : "")
                }
              >
                <CardHeader>
                  <div className="rounded-md bg-primary/10 p-2 w-fit text-primary">
                    <a.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-3 flex items-center gap-2">
                    {a.title}
                    {a.primary && (
                      <span className="text-[10px] uppercase tracking-wider bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                        Primary
                      </span>
                    )}
                  </CardTitle>
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
                  <Link
                    href={a.href}
                    className="text-primary text-sm mt-4 inline-flex items-center gap-1 hover:underline"
                  >
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
              Stand up an operations command center in 72 hours.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Emergency Deployment Package: fully configured OutbreakOS tenant,
              branded SITREPs, screening lanes, and contact monitoring live in
              under three days. Available for active mining / industrial /
              government situations.
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
