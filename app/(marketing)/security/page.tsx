import { PageHero } from "@/components/marketing/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, FileCheck, KeyRound, ScrollText, Users, Database } from "lucide-react";

const pillars = [
  { icon: Lock, title: "Encryption in transit", text: "All traffic served over TLS 1.2+. HSTS enforced on the production domain." },
  { icon: Database, title: "Encryption at rest", text: "Production data encrypted at rest via Supabase / managed Postgres. Backups encrypted." },
  { icon: Users, title: "Role-based access control", text: "Owner, Admin, Health Officer, Screener, Viewer — least-privilege enforced server-side." },
  { icon: ScrollText, title: "Audit trails", text: "Every screening, alert, resource change, and AI invocation is logged with actor and target." },
  { icon: Eye, title: "Privacy by design", text: "Anonymous-ID screening workflow available everywhere; PII minimized by default." },
  { icon: KeyRound, title: "Least privilege", text: "Multi-tenant isolation enforced at the database row level (RLS-ready schema)." },
  { icon: FileCheck, title: "Data export & deletion", text: "Self-serve data export and deletion request workflows for subjects and tenants." },
  { icon: Shield, title: "Human-in-the-loop", text: "AI recommendations require human review. No automated clinical actions." },
];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Security"
        title="Operations data deserves operational-grade security."
        description="OutbreakOS is built for ministries, hospitals, and operators who can't afford a breach mid-response."
      />

      <section className="container py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((p) => (
            <Card key={p.title}>
              <CardHeader>
                <div className="rounded-md bg-primary/10 p-2 w-fit text-primary">
                  <p.icon className="h-5 w-5" />
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
        <div className="container py-16">
          <h2 className="text-2xl font-bold">Technical posture</h2>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground max-w-3xl">
            <li>• Multi-tenant data isolation enforced at the row level (org_id column on every table, RLS policies enforced server-side).</li>
            <li>• Protected dashboard routes; unauthenticated traffic redirected to /login.</li>
            <li>• Server-side validation of every screening, alert, and resource mutation with Zod schemas.</li>
            <li>• Secrets never exposed to the frontend; only public anon keys are surfaced client-side.</li>
            <li>• AI provider abstraction: keys are server-only and providers can be disabled entirely.</li>
            <li>• Audit log retained per-tenant; exportable for after-action reviews.</li>
            <li>• Vercel / containerized deployment with environment-isolated builds.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
