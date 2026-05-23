import Link from "next/link";
import {
  ActivitySquare,
  ArrowRight,
  Boxes,
  ClipboardCheck,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { RiskPill, SeverityPill } from "@/components/ui/status-pill";
import { NotADiagnosticBanner } from "@/components/ui/disclaimer";
import { ScreeningChart } from "@/components/charts/screening-chart";
import { RegionList } from "@/components/charts/region-list";
import { OnboardingChecklist } from "@/components/app/onboarding-checklist";
import { AIRefreshButton } from "@/components/app/ai-refresh";
import { data } from "@/lib/store";
import { aiBriefingCached } from "@/lib/ai";
import { requireSession } from "@/lib/auth";
import { compactNumber, formatDateTime, relativeTime } from "@/lib/utils";
import { DEMO_TIMESERIES, DEMO_RISK_BREAKDOWN } from "@/lib/demo-data";

export default async function DashboardPage() {
  const sess = requireSession();
  const orgId = sess.orgId;
  const org = data.org(orgId)!;
  const regions = data.regions(orgId);
  const sites = data.sites(orgId);
  const screenings = data.screenings(orgId);
  const contacts = data.contacts(orgId);
  const resources = data.resources(orgId);
  const alerts = data.alerts(orgId);
  const audit = data.audit(orgId);
  const reports = data.reports(orgId);

  const isDemoOrg = orgId === "org_demo";

  // New tenant with no data? Show onboarding checklist and skip the heavy
  // dashboard so they aren't staring at zeros.
  const isEmpty = sites.length === 0 && screenings.length === 0;
  if (isEmpty) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome to {org.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            Five quick steps and you're ready to run operations from this command center.
          </p>
        </div>
        <OnboardingChecklist
          steps={[
            {
              done: sites.length > 0,
              label: "Add your first site",
              href: "/dashboard/sites",
              cta: "Add site",
            },
            {
              done: data.users(orgId).length > 1,
              label: "Invite your team",
              href: "/dashboard/settings",
              cta: "Open settings",
            },
            {
              done: false,
              label: "Configure operational risk weights",
              href: "/dashboard/settings",
              cta: "Configure",
            },
            {
              done: screenings.length > 0,
              label: "Run a test screening",
              href: "/dashboard/screenings/new",
              cta: "Run",
            },
            {
              done: reports.length > 0,
              label: "Generate your first SITREP",
              href: "/dashboard/reports",
              cta: "Generate",
            },
          ]}
        />
        <NotADiagnosticBanner />
      </div>
    );
  }

  const totals = regions.reduce(
    (acc, r) => ({
      confirmed: acc.confirmed + r.confirmed,
      suspected: acc.suspected + r.suspected,
      deaths: acc.deaths + r.deaths,
      contacts: acc.contacts + r.contactsMonitored,
    }),
    { confirmed: 0, suspected: 0, deaths: 0, contacts: 0 },
  );

  const openAlerts = alerts.filter((a) => a.status === "open");
  const urgentScreenings = screenings.filter((s) => s.risk === "urgent").length;
  const lowStockCount = resources.filter((r) => r.onHand < r.minStock).length;
  const activeContacts = contacts.filter((c) => c.status === "active").length;

  // Cached AI summary — does NOT run on every dashboard load.
  const aiSummary = await aiBriefingCached(orgId);

  const recentActivity = audit.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Operations Overview</h1>
          <p className="text-muted-foreground text-sm">
            {org.name} · {formatDateTime(new Date())}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/screenings/new">
            <Button>
              <ClipboardCheck className="h-4 w-4" /> New screening
            </Button>
          </Link>
          <Link href="/dashboard/reports">
            <Button variant="outline">
              <FileText className="h-4 w-4" /> Generate SITREP
            </Button>
          </Link>
          <Link href="/dashboard/ai">
            <Button variant="outline">
              <TrendingUp className="h-4 w-4" /> AI command
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Confirmed" value={totals.confirmed} intent={totals.confirmed > 0 ? "critical" : "default"} />
        <StatCard label="Suspected" value={totals.suspected} intent={totals.suspected > 0 ? "warning" : "default"} />
        <StatCard label="Deaths" value={totals.deaths} intent={totals.deaths > 0 ? "critical" : "default"} />
        <StatCard label="Contacts monitored" value={totals.contacts} />
        <StatCard label="Screenings (window)" value={compactNumber(screenings.length + (isDemoOrg ? 1838 : 0))} />
        <StatCard label="Urgent operational flags" value={urgentScreenings} intent={urgentScreenings ? "critical" : "default"} />
      </div>

      <NotADiagnosticBanner />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Screening volume — last 14 days</CardTitle>
              <p className="text-xs text-muted-foreground">
                Total screenings vs. flagged (monitor / elevated / urgent).
              </p>
            </div>
            <Link href="/dashboard/screenings">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ScreeningChart data={DEMO_TIMESERIES} riskBreakdown={DEMO_RISK_BREAKDOWN} />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary/15 text-primary flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <CardTitle>AI operational briefing</CardTitle>
              </div>
              <AIRefreshButton />
            </div>
            <p className="text-xs text-muted-foreground">
              Provider <code className="text-primary">{aiSummary.provider}</code>
              {aiSummary.cached && " · cached"} · human review required.
            </p>
          </CardHeader>
          <CardContent>
            <pre className="text-xs whitespace-pre-wrap font-sans text-muted-foreground leading-relaxed max-h-72 overflow-y-auto scrollbar-thin">
{aiSummary.text}
            </pre>
            <Link href="/dashboard/ai" className="inline-block mt-3">
              <Button size="sm" variant="outline">
                Open AI command
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Operational picture by region</CardTitle>
              <p className="text-xs text-muted-foreground">
                Confirmed, suspected, deaths, and contacts under monitoring.
              </p>
            </div>
            <Link href="/dashboard/map">
              <Button variant="ghost" size="sm">
                Open map <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <RegionList regions={regions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Open alerts</CardTitle>
            <Link href="/dashboard/alerts">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {openAlerts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No open alerts. Operations nominal.
              </p>
            )}
            {openAlerts.slice(0, 5).map((a) => (
              <Link
                key={a.id}
                href="/dashboard/alerts"
                className="block rounded-md border border-border p-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium line-clamp-1">{a.title}</p>
                  <SeverityPill severity={a.severity} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {a.description}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {relativeTime(a.createdAt)}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>High-tier operational flags</CardTitle>
            <Link href="/dashboard/screenings">
              <Button variant="ghost" size="sm">
                All <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {screenings
              .filter((s) => s.risk === "urgent" || s.risk === "elevated")
              .slice(0, 4)
              .map((s) => (
                <Link
                  key={s.id}
                  href={`/dashboard/screenings/${s.id}`}
                  className="block rounded-md border border-border p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{s.subjectName}</p>
                    <RiskPill risk={s.risk} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.context.replace("_", " ")} · {s.originRegion} → {s.destination}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {relativeTime(s.createdAt)}
                  </p>
                </Link>
              ))}
            {screenings.filter((s) => s.risk === "urgent" || s.risk === "elevated").length === 0 && (
              <p className="text-sm text-muted-foreground">No high-tier flags in window.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Contacts under monitoring</CardTitle>
            <Link href="/dashboard/contacts">
              <Button variant="ghost" size="sm">
                All <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums">{activeContacts}</span>
              <span className="text-xs text-muted-foreground">active</span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs">
              {(["active", "escalated", "cleared", "lost_to_follow_up"] as const).map((s) => {
                const count = contacts.filter((c) => c.status === s).length;
                return (
                  <div key={s} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">
                      {s.replace(/_/g, " ")}
                    </span>
                    <span className="font-medium tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
            <Link href="/dashboard/contacts" className="block mt-4">
              <Button size="sm" variant="outline" className="w-full">
                <Users className="h-4 w-4" /> Manage contacts
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Resource status</CardTitle>
            <Link href="/dashboard/resources">
              <Button variant="ghost" size="sm">
                All <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums">{lowStockCount}</span>
              <span className="text-xs text-muted-foreground">items below threshold</span>
            </div>
            <div className="mt-3 space-y-2">
              {resources
                .filter((r) => r.onHand < r.minStock)
                .slice(0, 3)
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-xs">
                    <span className="truncate">{r.label}</span>
                    <Badge variant="warning">
                      {r.onHand} / {r.minStock} {r.unit}
                    </Badge>
                  </div>
                ))}
              {lowStockCount === 0 && (
                <p className="text-xs text-muted-foreground">All items above minimum stock.</p>
              )}
            </div>
            <Link href="/dashboard/resources" className="block mt-4">
              <Button size="sm" variant="outline" className="w-full">
                <Boxes className="h-4 w-4" /> Manage resources
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {recentActivity.map((a) => (
              <li key={a.id} className="py-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <ActivitySquare className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate">
                      <span className="text-muted-foreground">{a.actor}</span>{" "}
                      <span className="font-medium">{a.action}</span>{" "}
                      <code className="text-xs text-primary">{a.target}</code>
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-3">
                  {relativeTime(a.createdAt)}
                </span>
              </li>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">
                No activity yet. Run a screening to populate the audit trail.
              </p>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
