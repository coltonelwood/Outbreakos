import { PageHero } from "@/components/marketing/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plane, Shield, ClipboardCheck, Bell, Users, ArrowRight, CheckCircle2 } from "lucide-react";

const features = [
  { icon: ClipboardCheck, title: "Gate-level screening lanes", text: "Optimized intake forms for travelers — risk-tiered output for screeners in seconds." },
  { icon: Bell, title: "Instant escalation", text: "Urgent-tier travelers route directly to on-call health officer with audit trail." },
  { icon: Users, title: "Auto contact enrollment", text: "Cleared-but-monitor travelers join 21-day SMS / WhatsApp daily symptom check-in." },
  { icon: Shield, title: "Risk-corridor intelligence", text: "Inbound flights from active outbreak regions flagged before wheels-down." },
];

export default function AirportsPage() {
  return (
    <>
      <PageHero
        eyebrow="Airport Point-of-Entry Mode"
        title="Hold the line at the gate. Without holding the line."
        description="Risk-tiered traveler screening, automatic contact enrollment, and clean handover to health authorities — without breaking throughput."
      >
        <div className="flex gap-3">
          <Link href="/contact">
            <Button size="lg">
              Brief our airport ops team <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard/screenings/new">
            <Button size="lg" variant="outline">
              Try a screening form
            </Button>
          </Link>
        </div>
      </PageHero>

      <section className="container py-16 lg:py-20">
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{f.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{f.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="container py-16">
          <h2 className="text-2xl font-bold mb-6">Deployment outcomes</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { value: "4m 12s", label: "Avg. screening time" },
              { value: "100%", label: "Urgent-tier audit trail coverage" },
              { value: "< 72h", label: "Time to stand up at a major hub" },
            ].map((o) => (
              <div key={o.label} className="rounded-lg border border-border bg-card p-6">
                <div className="text-3xl font-bold">{o.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{o.label}</div>
              </div>
            ))}
          </div>
          <ul className="mt-8 space-y-2 text-sm">
            {[
              "Multi-lane intake with shift-aware screener accounts",
              "Inbound flight risk-corridor scoring",
              "Auto-generated daily Airport Screening Report",
              "Compatible with existing health-authority handover protocols",
            ].map((p) => (
              <li key={p} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container py-16">
        <div className="rounded-2xl border border-border bg-card p-10">
          <div className="flex items-center gap-3">
            <Plane className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-semibold">Reference deployment</h3>
          </div>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Demo scenario: Entebbe International Airport runs OutbreakOS during
            a Bundibugyo-corridor surge. Gate B12 isolates an urgent-tier traveler,
            health-authority handover completes within the audit window, and a
            same-day Airport Screening Report is auto-published to the ministry.
          </p>
          <div className="mt-6">
            <Link href="/dashboard">
              <Button>Open Entebbe demo</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
