import { db } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, KeyRound, Users, Cog, Palette } from "lucide-react";
import Link from "next/link";
import { ExportButton } from "./export-button";

export default function SettingsPage() {
  const d = db();
  const s = d.settings;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Organization profile, users and roles, AI / messaging providers, risk
          scoring, branding, and data export.
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
            <Field label="Organization name" value={d.org.name} />
            <Field label="Slug" value={d.org.slug} />
            <Field label="Operating mode" value={d.org.mode.replace("_", " ")} />
            <Field label="Created" value={d.org.createdAt} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Users & roles</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {d.users.map((u) => (
                <li key={u.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <Badge variant="muted" className="capitalize">{u.role.replace("_", " ")}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <CardTitle>Providers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>AI provider</Label>
              <Select defaultValue={s.aiProvider} disabled>
                <option value="none">None (deterministic templates)</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </Select>
              <p className="text-xs text-muted-foreground">
                Configure via the <code>AI_PROVIDER</code> env var. Keys are
                server-only and never exposed to the browser.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Messaging provider</Label>
              <Select defaultValue={s.messagingProvider} disabled>
                <option value="none">None (templates only)</option>
                <option value="twilio">Twilio</option>
                <option value="whatsapp">WhatsApp Business</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Stored API keys</Label>
              <ul className="space-y-1.5">
                {s.apiKeysMasked.map((k) => (
                  <li key={k.name} className="text-sm flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <span>{k.name}</span>
                    <code className="text-xs text-muted-foreground">…{k.lastFour}</code>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Branding & risk scoring</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Branding</Label>
              <div className="flex items-center gap-3 text-sm">
                <span className="inline-flex h-8 w-8 rounded-md" style={{ background: d.org.branding.primary }} />
                <span>{d.org.branding.logoText}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Risk scoring weights</Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(s.riskWeights).map(([k, v]) => (
                  <div key={k} className="flex justify-between rounded-md border border-border px-3 py-2">
                    <span className="capitalize text-muted-foreground">{k}</span>
                    <span className="font-medium tabular-nums">+{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Defaults shown. Weight adjustments in production require admin
                role and are recorded in the audit log.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data export</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-muted-foreground max-w-2xl">
            Export this organization's screenings, contacts, alerts, resources,
            and audit log as JSON. Use for after-action reviews, ministry data
            requests, or migration to another platform.
          </p>
          <ExportButton />
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
