import { PageHero } from "@/components/marketing/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Hospital, ClipboardCheck, Boxes, Bell, Users, ArrowRight, CheckCircle2 } from "lucide-react";

const features = [
  { icon: ClipboardCheck, title: "Intake risk tiering", text: "Clinic intake assigns operational tier; suspected cases routed to isolation pathway." },
  { icon: Boxes, title: "PPE burn rate alerts", text: "Inventory burn rate predicts when you'll run out — before you do." },
  { icon: Users, title: "Contact tracing", text: "Link patients to family contacts, auto-enroll for 21-day daily check-ins." },
  { icon: Bell, title: "Lab sample tracking", text: "Sample collection → transit → result, with pending alerts to clinical leads." },
];

export default function HospitalsPage() {
  return (
    <>
      <PageHero
        eyebrow="Hospitals & Clinics"
        title="Right-place every patient. Defend every PPE kit."
        description="Operational triage, isolation capacity awareness, and PPE / sample-kit logistics — without replacing the EHR."
      >
        <div className="flex gap-3">
          <Link href="/contact">
            <Button size="lg">
              Brief clinical leadership <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              Open hospital demo
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
          <div className="rounded-2xl border border-border bg-card p-10">
            <Hospital className="h-6 w-6 text-primary" />
            <h2 className="mt-3 text-2xl font-bold">A non-diagnostic layer that respects clinicians.</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              OutbreakOS does not diagnose. It provides operational triage tiers,
              isolation capacity views, and logistics signals that help clinical
              teams move faster and protect their staff. Every recommendation
              is explainable, auditable, and reviewable.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "Clear operational vs. clinical decision boundaries",
                "Audit log of every screening, alert, and resource change",
                "Compatible with WHO Ebola virus disease case definitions",
                "Privacy-by-design data handling",
              ].map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
