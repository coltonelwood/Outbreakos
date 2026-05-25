import { PageHero } from "@/components/marketing/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  Eye,
  FileCheck,
  KeyRound,
  ScrollText,
  Users,
  Database,
} from "lucide-react";

interface Pillar {
  icon: typeof Shield;
  title: string;
  text: string;
  status: "live" | "pilot" | "roadmap";
}

const pillars: Pillar[] = [
  {
    icon: Lock,
    title: "Signed sessions",
    text: "Session cookies are HMAC-signed server-side; a user cannot forge a session by editing the cookie.",
    status: "live",
  },
  {
    icon: Users,
    title: "Role-based access control",
    text: "Owner / Admin / Health Officer / Screener / Viewer — enforced on every server-side mutation, not just the UI.",
    status: "live",
  },
  {
    icon: ScrollText,
    title: "Audit trails",
    text: "Every screening, alert, AI invocation, resource change, settings change, and export is logged with actor, target, and timestamp. Exportable as CSV.",
    status: "live",
  },
  {
    icon: KeyRound,
    title: "Multi-tenant isolation",
    text: "Every entity carries an org_id; every API mutation enforces it. Production schema enforces isolation at the row level via RLS.",
    status: "live",
  },
  {
    icon: Database,
    title: "Encryption in transit + at rest",
    text: "TLS 1.2+ everywhere; HSTS enforced. At-rest encryption applies in your chosen backing store (Supabase / managed Postgres). Demo mode uses in-process state.",
    status: "live",
  },
  {
    icon: Shield,
    title: "Rate limiting",
    text: "Per-IP token-bucket on auth, AI, and lead endpoints to mitigate abuse and credential-stuffing.",
    status: "live",
  },
  {
    icon: Eye,
    title: "Privacy by design",
    text: "Anonymous-ID screening flow available everywhere; PII minimized by default; exports support privacy-safe variants.",
    status: "live",
  },
  {
    icon: FileCheck,
    title: "SSO / SAML / OIDC",
    text: "Single sign-on with Okta / Azure AD / Google Workspace. Available in enterprise pilot deployments.",
    status: "pilot",
  },
  {
    icon: Shield,
    title: "SCIM provisioning",
    text: "Automated user provisioning and deprovisioning from your IdP.",
    status: "roadmap",
  },
  {
    icon: Shield,
    title: "SOC 2 Type II",
    text: "On the roadmap. Audit firm engagement target Q4 of pilot year.",
    status: "roadmap",
  },
  {
    icon: Shield,
    title: "Data residency",
    text: "EU / Africa / APAC deployment regions. Available in enterprise pilot deployments.",
    status: "pilot",
  },
  {
    icon: Shield,
    title: "Customer-managed encryption keys",
    text: "BYO-KMS for at-rest encryption.",
    status: "roadmap",
  },
];

const statusBadge = (status: Pillar["status"]) => {
  if (status === "live") return <Badge variant="success">Live</Badge>;
  if (status === "pilot") return <Badge variant="warning">Enterprise pilot</Badge>;
  return <Badge variant="muted">Roadmap</Badge>;
};

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Security"
        title="Operations data deserves operational-grade security."
        description="Honest about what's live today and what's on the roadmap."
      />

      <section className="container py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map((p) => (
            <Card key={p.title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="rounded-md bg-primary/10 p-2 w-fit text-primary">
                    <p.icon className="h-5 w-5" />
                  </div>
                  {statusBadge(p.status)}
                </div>
                <CardTitle className="mt-3 text-base">{p.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{p.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="container py-16 max-w-3xl">
          <h2 className="text-2xl font-bold">Security contact</h2>
          <p className="mt-3 text-muted-foreground">
            Report a vulnerability or request our DPA / sub-processors list via
            the contact form with subject "Security." Responsible disclosure is
            welcomed and acknowledged.
          </p>
        </div>
      </section>
    </>
  );
}
