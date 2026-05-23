import { PageHero } from "@/components/marketing/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotADiagnosticBanner } from "@/components/ui/disclaimer";
import { FileCheck, Globe2, HeartPulse, Scale, ShieldCheck } from "lucide-react";

export default function CompliancePage() {
  return (
    <>
      <PageHero
        eyebrow="Compliance"
        title="Built for the realities of public health operations."
        description="OutbreakOS is an operational platform, not a medical device. It aligns with international guidance and respects clinical authority."
      />

      <section className="container py-12 space-y-6 max-w-4xl">
        <NotADiagnosticBanner />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>Scope of use</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>OutbreakOS is intended to support operational outbreak response. Specifically:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Traveler and worker screening triage at points of entry and site entry</li>
              <li>Contact monitoring and 21-day check-in workflows</li>
              <li>Resource and PPE logistics tracking</li>
              <li>Situation reporting, donor and ministry briefings</li>
              <li>Coordination across multiple response sites and partners</li>
            </ul>
            <p className="mt-2">OutbreakOS is <strong>not</strong> intended for:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Diagnosing infectious disease</li>
              <li>Determining or confirming a person's infection status</li>
              <li>Replacing clinical judgment</li>
              <li>Substituting for laboratory testing</li>
            </ul>
            <p>Clinical decisions must be made by qualified health and public-health authorities following local protocols and WHO / CDC guidance.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-primary" />
              <CardTitle>Data protection</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>OutbreakOS supports anonymous-ID screening workflows by default and minimizes the collection of personally identifying information. Tenants can configure:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Anonymous-only screening at points of entry</li>
              <li>Configurable retention windows per data category</li>
              <li>Self-serve data export and deletion requests</li>
              <li>Multi-tenant isolation at the database row level</li>
            </ul>
            <p>Tenants remain the controllers of their data; OutbreakOS operates as a processor under standard data processing terms.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Globe2 className="h-5 w-5 text-primary" />
              <CardTitle>Alignment</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>OutbreakOS workflows are designed to align with widely-used international guidance:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>WHO Ebola virus disease case definitions for suspected / probable / confirmed</li>
              <li>21-day contact monitoring windows</li>
              <li>Standard point-of-entry traveler screening practice (IATA / ICAO health screening guidance)</li>
              <li>Local ministry of health protocols (configurable per deployment)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <HeartPulse className="h-5 w-5 text-primary" />
              <CardTitle>Human-in-the-loop</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Every AI-generated output in OutbreakOS — briefings, summaries, stakeholder drafts, resource recommendations — is presented with an explicit human review requirement. The platform does not take autonomous clinical actions.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-primary" />
              <CardTitle>Auditability</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>OutbreakOS records an immutable audit log of every screening, alert, AI invocation, resource adjustment, and report generation event. Logs are exportable to support after-action reviews and ministry inquiries.</p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
