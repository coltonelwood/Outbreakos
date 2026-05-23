import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

const STEPS = [
  {
    title: "Open the Command Center",
    href: "/dashboard",
    why: "First impression: live ops picture, AI exec summary, screening volume, regional spread.",
    say: '"This is what a response leader sees at 7am. Six stats at the top, AI summary on the right, regional cases below."',
  },
  {
    title: "Show the Outbreak Map",
    href: "/dashboard/map",
    why: "Visual proof of the cross-border situation with severity filters.",
    say: '"Bundibugyo cluster and Ituri cluster light up. Click a region for live counts. Toggle filters for cases vs. contacts vs. points of entry."',
  },
  {
    title: "Run a screening",
    href: "/dashboard/screenings/new",
    why: "Demonstrates the actual workflow that protects the airport / mine / hospital.",
    say: '"Anonymous traveler from Bunia, has fever, attended a funeral. Watch the operational risk tier and the recommended action update — explainable, never diagnostic."',
  },
  {
    title: "Look at contact monitoring",
    href: "/dashboard/contacts",
    why: "Shows the 21-day timeline and SMS / WhatsApp template messages.",
    say: '"This is what happens after the screening. 21-day daily check-ins, color-coded timeline, one-click escalation, ready-to-send templates."',
  },
  {
    title: "Generate a SITREP",
    href: "/dashboard/reports",
    why: "The single most-loved boardroom feature.",
    say: '"Click Daily SITREP. 90 seconds later it\'s in front of the minister. Print or share."',
  },
  {
    title: "Open the AI Command Center",
    href: "/dashboard/ai",
    why: "Differentiator — shows internal-data citations and human-in-the-loop disclaimer.",
    say: '"Watch it generate a stakeholder draft, then cite which sites and regions it pulled from. Every answer comes with a human-review disclaimer."',
  },
  {
    title: "Show the multi-site command view",
    href: "/dashboard/command",
    why: "Boardroom view — corridors, clusters, sites.",
    say: '"This is the screen the ops director has on the wall. Risk corridors, cluster detection, every site\'s status."',
  },
  {
    title: "Finish with security & audit",
    href: "/dashboard/audit",
    why: "Closes the sale for ministries and large enterprises.",
    say: '"Every action — screening, alert, AI call — is logged. Exportable. Privacy by design. Multi-tenant isolation."',
  },
];

export default function DemoScriptPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Demo Script
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          An eight-stop, twelve-minute customer demo. Each step opens a real
          live page — every number is rendered from seeded data so you can
          rehearse confidently.
        </p>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/30">
        <CardContent className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Sales one-liner</p>
          <p className="mt-2 text-lg font-semibold">
            "OutbreakOS is the operations command center for outbreak response —
            airport screening, contact monitoring, resource logistics, AI briefings,
            without ever pretending to be a diagnostic tool."
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {STEPS.map((s, i) => (
          <Card key={s.href}>
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
              <Badge variant="muted" className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold">
                {i + 1}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{s.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.why}</p>
                <p className="mt-2 text-sm italic">"{s.say.replace(/"/g, "")}"</p>
              </div>
              <Link href={s.href} className="shrink-0">
                <Button variant="outline">
                  Open <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Wrap up — what to leave them with</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Send the ROI calculator link with their numbers pre-filled.</p>
          <p className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Offer the Emergency Deployment Package if there's an active situation.</p>
          <p className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />Promise a tailored daily SITREP within 24 hours of any pilot signing.</p>
        </CardContent>
      </Card>
    </div>
  );
}
