import { data, db } from "@/lib/store";
import { currentUser, requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Users, Cog, Palette, KeyRound, Slack } from "lucide-react";
import { ExportButton } from "./export-button";
import { RiskWeightsForm } from "./risk-weights-form";
import { UsersClient } from "./users-client";
import { LogoutAllButton } from "./logout-all-button";

export default function SettingsPage() {
  const sess = requireSession();
  const user = currentUser()!;
  const org = data.org(sess.orgId)!;
  const settings = data.settings(sess.orgId);
  const users = data.users(sess.orgId).map((u) => ({ ...u, deactivated: db().deactivated.has(u.id) }));
  const canUpdate = can(user.role, "settings.update");
  const canExport = can(user.role, "org.export");
  const canManageUsers = can(user.role, "user.invite");

  const integrations = [
    {
      name: "Slack (leads + alerts)",
      status: process.env.LEADS_WEBHOOK_URL ? "live" : "not configured",
      description: "Routes new leads and high-severity alerts to a Slack channel.",
    },
    {
      name: "AI provider",
      status: settings.aiProvider === "none" ? "deterministic fallback" : `live (${settings.aiProvider})`,
      description: "Generates briefings, summaries, drafts. Configure via AI_PROVIDER env var.",
    },
    {
      name: "Messaging (SMS / WhatsApp)",
      status: settings.messagingProvider === "none" ? "templates only" : `live (${settings.messagingProvider})`,
      description: "Sends contact monitoring check-ins. Templates always available; live send requires provider keys.",
    },
    {
      name: "Supabase database",
      status: process.env.NEXT_PUBLIC_SUPABASE_URL ? "live" : "in-memory demo store",
      description: "Persistent multi-tenant data layer. Schema in /supabase/schema.sql.",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Organization profile, users and roles, providers, risk scoring, branding, and data export.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cog className="h-5 w-5 text-primary" />
              <CardTitle>Organization profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Organization name" value={org.name} />
            <Field label="Slug" value={org.slug} />
            <Field label="Operating mode" value={org.mode.replace("_", " ")} />
            <Field label="Created" value={org.createdAt} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Users & roles</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Invite teammates, change roles, and deactivate accounts. Role
              changes and deactivations immediately revoke the user's sessions.
            </p>
          </CardHeader>
          <CardContent>
            {canManageUsers ? (
              <UsersClient users={users} currentUserId={user.id} />
            ) : (
              <ul className="divide-y divide-border">
                {users.map((u) => (
                  <li key={u.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                    <Badge variant="muted" className="capitalize">{u.role.replace("_", " ")}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Sign out of every device for your own account.
              </div>
              <LogoutAllButton />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Slack className="h-5 w-5 text-primary" />
              <CardTitle>Integrations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {integrations.map((i) => (
                <li
                  key={i.name}
                  className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{i.name}</div>
                    <div className="text-xs text-muted-foreground">{i.description}</div>
                  </div>
                  <Badge
                    variant={
                      i.status.startsWith("live") ? "success" : "muted"
                    }
                    className="shrink-0"
                  >
                    {i.status}
                  </Badge>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Only integrations that are actually configured are listed. To enable
              more, set the corresponding environment variable and redeploy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Branding</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 text-sm">
              <span
                className="inline-flex h-10 w-10 rounded-md items-center justify-center font-bold text-primary-foreground"
                style={{ background: org.branding.primary }}
              >
                {org.branding.logoText.slice(0, 2)}
              </span>
              <span>{org.branding.logoText}</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Per-tenant branding is applied to SITREPs and the print/PDF report header.
              Logo upload is part of the enterprise pilot package.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <CardTitle>Operational risk scoring</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Transparent and configurable. Every change is recorded in the audit log.
            These weights drive the operational triage tier (not a diagnosis).
          </p>
        </CardHeader>
        <CardContent>
          <RiskWeightsForm initial={settings.riskWeights} disabled={!canUpdate} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data export</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-muted-foreground max-w-2xl">
            Owners can export this organization's screenings, contacts, alerts,
            resources, and audit log as JSON. Use for after-action reviews,
            ministry data requests, or migration to another platform.
          </p>
          {canExport ? (
            <ExportButton />
          ) : (
            <Badge variant="muted">Owner only</Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} readOnly />
    </div>
  );
}
