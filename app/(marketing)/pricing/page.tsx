import { PageHero } from "@/components/marketing/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Industrial Site",
    price: "$60,000",
    cadence: "per site / year",
    description: "Single-site continuity-of-operations for a mine, industrial camp, airport, hospital, or clinic.",
    features: [
      "1 site, up to 25 users",
      "Screening workflows + operational tiering",
      "21-day contact monitoring",
      "Daily SITREP generation",
      "Role-based access + audit log",
      "Email + chat support",
    ],
    cta: { label: "Talk to sales", href: "/contact?intent=industrial" },
  },
  {
    name: "Multi-Site Command",
    price: "$25,000",
    cadence: "per month",
    description: "Cross-site coordination for an operator or response cluster.",
    features: [
      "Up to 10 sites, unlimited users",
      "Multi-site command view + corridors",
      "AI command assistant (with provider plug-in)",
      "Branded SITREPs + donor reports",
      "Slack alert routing",
      "Custom risk weighting per org",
      "Priority response support",
    ],
    highlight: true,
    cta: { label: "Talk to deployment team", href: "/contact?intent=pilot" },
  },
  {
    name: "Government / Enterprise",
    price: "Custom",
    cadence: "from $100k / year",
    description: "Nation-wide or enterprise-wide deployment with SLAs, integrations, and procurement-friendly artifacts.",
    features: [
      "Unlimited sites and users",
      "Government Emergency Operations Mode",
      "Risk corridor + cluster detection",
      "Custom integrations (lab, EHR, ministry feeds)",
      "Dedicated deployment engineer",
      "SSO / SAML / OIDC (pilot)",
      "DPA + security questionnaire pack",
    ],
    cta: { label: "Contact sales", href: "/contact?intent=enterprise" },
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Priced for the operations that can't afford to be down."
        description="Transparent tiers for industrial sites, multi-site responses, and national programs."
      />

      <section className="container py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <Card
              key={t.name}
              className={
                t.highlight
                  ? "border-primary/60 bg-card relative shadow-xl shadow-primary/10"
                  : ""
              }
            >
              {t.highlight && (
                <div className="absolute -top-3 left-5 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Best for multi-site response
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{t.name}</CardTitle>
                <p className="text-3xl font-bold">{t.price}</p>
                <p className="text-sm text-muted-foreground">{t.cadence}</p>
                <p className="text-sm text-muted-foreground mt-2">{t.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={t.cta.href} className="block mt-6">
                  <Button
                    className="w-full"
                    variant={t.highlight ? "default" : "outline"}
                  >
                    {t.cta.label}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container py-16">
        <div className="rounded-2xl border border-[hsl(var(--warning))]/40 bg-[hsl(var(--warning))]/5 p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--warning))]">
            Emergency Deployment Package
          </p>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold">
            $150,000 — 30-day deployment + monthly retainer
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Fully configured OutbreakOS tenant, branded SITREPs, screening lanes,
            and contact monitoring live within 72 hours. For ministries, NGOs,
            and operators responding to an active situation.
          </p>
          <ul className="mt-6 grid md:grid-cols-2 gap-2 text-sm">
            {[
              "Dedicated deployment engineer for 30 days",
              "On-site or remote screener training",
              "Branded donor / ministry reporting templates",
              "Direct deployment Slack channel + on-call response",
            ].map((p) => (
              <li key={p} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-[hsl(var(--warning))] mt-0.5 shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <Link href="/contact?intent=emergency" className="inline-block mt-6">
            <Button>Request emergency deployment</Button>
          </Link>
        </div>
      </section>

      <section className="container pb-20">
        <h2 className="text-2xl font-bold mb-3">Run the numbers</h2>
        <p className="text-muted-foreground max-w-2xl">
          Use the ROI calculator to model continuity protection, screening
          throughput, and conservative avoided downtime at your operation. The
          calculator uses the same pricing function as this page, so the
          numbers reconcile.
        </p>
        <Link href="/roi" className="inline-block mt-4">
          <Button variant="outline">Open ROI calculator</Button>
        </Link>
      </section>
    </>
  );
}
