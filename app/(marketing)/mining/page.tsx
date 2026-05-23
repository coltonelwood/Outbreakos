import { PageHero } from "@/components/marketing/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Activity, Shield, ClipboardCheck, Users, Boxes, ArrowRight, CheckCircle2 } from "lucide-react";

const features = [
  { icon: ClipboardCheck, title: "Site-entry screening", text: "Worker rotation health log integrated with shift sign-on." },
  { icon: Users, title: "Workforce monitoring", text: "Auto-enrolled daily check-ins for returning workers from active regions." },
  { icon: Shield, title: "Lockdown playbook", text: "Predefined operational tiers from heightened surveillance to full lockdown." },
  { icon: Boxes, title: "On-site logistics", text: "PPE / sample kit inventory at the camp, with reorder thresholds." },
];

export default function MiningPage() {
  return (
    <>
      <PageHero
        eyebrow="Mining Site Protection Mode"
        title="Protect your workforce. Protect your continuity."
        description="A shutdown costs millions per day. OutbreakOS gives mining operators a structured response that protects workers without losing production windows."
      >
        <div className="flex gap-3">
          <Link href="/contact">
            <Button size="lg">
              Talk to operations <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/roi">
            <Button size="lg" variant="outline">
              Run continuity ROI
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
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <Activity className="h-6 w-6 text-primary" />
              <h2 className="mt-3 text-2xl font-bold">From "we have a worker with a fever" to "we have a plan."</h2>
              <ul className="mt-6 space-y-2 text-sm">
                {[
                  "Risk-tiered entry decisions in under 5 minutes",
                  "Auto-enroll affected workers in 21-day monitoring",
                  "Site lead, HSE, and corporate dashboard alignment",
                  "Stakeholder updates ready for board / ministry / partners",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="inline-block mt-6">
                <Button>Open mining-site demo</Button>
              </Link>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Estimated continuity value</p>
              <p className="mt-3 text-3xl font-bold">$2.4M / day</p>
              <p className="text-sm text-muted-foreground">Avoided downtime at a mid-size operation under threat of unplanned shutdown.</p>
              <p className="mt-6 text-xs text-muted-foreground">Run your own numbers with the ROI calculator.</p>
              <Link href="/roi" className="inline-block mt-2">
                <Button variant="outline" size="sm">ROI calculator</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
