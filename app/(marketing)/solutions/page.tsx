import { PageHero } from "@/components/marketing/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, Plane, Activity, Hospital, Globe2 } from "lucide-react";

const solutions = [
  {
    href: "/airports",
    icon: Plane,
    title: "Airports",
    description: "Traveler screening, gate-level escalation, risk-corridor flags.",
    outcomes: [
      "Reduce missed flag rate at point of entry",
      "Maintain throughput under heightened screening",
      "Clean handover to health authority",
    ],
  },
  {
    href: "/mining",
    icon: Activity,
    title: "Mining & Industrial Sites",
    description: "Worker entry health screening, rotation tracking, site continuity playbooks.",
    outcomes: [
      "Protect workforce while keeping production live",
      "Lockdown / re-open playbooks ready",
      "Operator-visible risk dashboards",
    ],
  },
  {
    href: "/hospitals",
    icon: Hospital,
    title: "Hospitals & Clinics",
    description: "Intake risk tiering, isolation capacity, lab tracking, PPE burn rate.",
    outcomes: [
      "Right-place the next patient",
      "Never run out of PPE unexpectedly",
      "Faster, defensible referrals",
    ],
  },
  {
    href: "/government",
    icon: Globe2,
    title: "Governments & NGOs",
    description: "Cross-border coordination, donor / ministry reporting, field logistics.",
    outcomes: [
      "Single source of truth across regions",
      "Branded SITREPs in seconds",
      "Joint coordination across borders",
    ],
  },
];

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title="A single platform for every part of an outbreak response."
        description="Choose the operating mode for your team — the rest of OutbreakOS adapts to your workflow."
      />
      <section className="container py-16 lg:py-20">
        <div className="grid md:grid-cols-2 gap-6">
          {solutions.map((s) => (
            <Card key={s.title} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{s.title}</CardTitle>
                </div>
                <p className="text-muted-foreground mt-2">{s.description}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2 flex-1">
                  {s.outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
                <Link href={s.href} className="mt-6">
                  <Button variant="outline" className="w-full">
                    Learn more
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
