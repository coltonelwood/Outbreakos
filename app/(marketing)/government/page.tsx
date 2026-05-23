import { PageHero } from "@/components/marketing/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Globe2, Users, ClipboardCheck, FileText, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";

const features = [
  { icon: MapPin, title: "Cross-border coordination", text: "Aligned intelligence picture across ministries, NGOs, and border posts." },
  { icon: FileText, title: "Daily SITREPs in seconds", text: "Branded daily situation reports for leadership, ministry, and donors." },
  { icon: ClipboardCheck, title: "Field response logistics", text: "PPE, transport, sample kit deployment with reorder recommendations." },
  { icon: Users, title: "Field team accounts", text: "Role-based access for screeners, health officers, admins, and viewers." },
];

export default function GovPage() {
  return (
    <>
      <PageHero
        eyebrow="Governments & NGOs"
        title="One operational picture. Every stakeholder."
        description="From the district health officer to the minister, from a partner NGO to the donor — same data, role-appropriate views."
      >
        <div className="flex gap-3">
          <Link href="/contact">
            <Button size="lg">
              Coordinate a pilot <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard/reports">
            <Button size="lg" variant="outline">
              See sample SITREP
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
              <Globe2 className="h-6 w-6 text-primary" />
              <h2 className="mt-3 text-2xl font-bold">Government Emergency Operations Mode</h2>
              <p className="mt-3 text-muted-foreground">
                A dedicated configuration for national emergency operations
                centers — multi-site command, risk corridor tracking, automated
                stakeholder briefings, and exec-ready dashboards.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {[
                  "Joint UG/DRC-style cross-border coordination",
                  "Donor-ready impact and reach reports",
                  "Field response logistics with reorder forecasts",
                  "Independent audit log for after-action reviews",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Mode: NGO Field Response</p>
              <h3 className="mt-2 text-xl font-semibold">Built for the field.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Mobile-responsive UI, offline-tolerant data capture flow, and
                role-aware accounts for screeners at the front line. Branded
                donor reports auto-generated and exportable.
              </p>
              <Link href="/dashboard" className="inline-block mt-4">
                <Button>Open command center</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
