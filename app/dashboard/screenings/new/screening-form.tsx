"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RiskPill } from "@/components/ui/status-pill";
import { Printer, Save, ShieldAlert } from "lucide-react";
import type { Site, Risk } from "@/lib/types";

interface FormState {
  context: "airport" | "site_entry" | "clinic";
  siteId: string;
  subjectName: string;
  anonymous: boolean;
  ageRange: "0-17" | "18-39" | "40-59" | "60+";
  originCountry: string;
  originRegion: string;
  destination: string;
  travelHistory: string;
  contactWithCase: boolean;
  fever: boolean;
  vomitingDiarrhea: boolean;
  unexplainedBleeding: boolean;
  fatigue: boolean;
  headache: boolean;
  hcwExposure: boolean;
  funeralExposure: boolean;
  notes: string;
}

interface ResultState {
  id: string;
  risk: Risk;
  score: number;
  action: string;
  rationale: string[];
}

export function ScreeningForm({ sites, userId }: { sites: Site[]; userId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [form, setForm] = useState<FormState>({
    context: "airport",
    siteId: sites[0]?.id ?? "",
    subjectName: "",
    anonymous: true,
    ageRange: "18-39",
    originCountry: "DRC",
    originRegion: "",
    destination: "",
    travelHistory: "",
    contactWithCase: false,
    fever: false,
    vomitingDiarrhea: false,
    unexplainedBleeding: false,
    fatigue: false,
    headache: false,
    hcwExposure: false,
    funeralExposure: false,
    notes: "",
  });

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const r = await fetch("/api/screenings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, userId }),
    });
    const j = await r.json();
    setSubmitting(false);
    if (r.ok && j.screening) {
      setResult({
        id: j.screening.id,
        risk: j.screening.risk,
        score: j.score,
        action: j.screening.action,
        rationale: j.screening.rationale,
      });
      router.refresh();
    }
  }

  if (result) {
    return <ScreeningResultPanel result={result} subjectName={form.subjectName || `Anonymous-${result.id.slice(-4)}`} />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Section: context */}
      <Section title="Encounter context">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Context">
            <Select value={form.context} onChange={(e) => set("context", e.target.value as FormState["context"])}>
              <option value="airport">Airport traveler</option>
              <option value="site_entry">Worker / site entry</option>
              <option value="clinic">Clinic intake</option>
            </Select>
          </Field>
          <Field label="Site">
            <Select value={form.siteId} onChange={(e) => set("siteId", e.target.value)}>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Age range">
            <Select value={form.ageRange} onChange={(e) => set("ageRange", e.target.value as FormState["ageRange"])}>
              <option value="0-17">0–17</option>
              <option value="18-39">18–39</option>
              <option value="40-59">40–59</option>
              <option value="60+">60+</option>
            </Select>
          </Field>
        </div>
      </Section>

      {/* Section: subject */}
      <Section title="Subject">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={form.anonymous ? "Anonymous ID (auto)" : "Subject name"}>
            <Input
              value={form.subjectName}
              onChange={(e) => set("subjectName", e.target.value)}
              placeholder={form.anonymous ? "Auto-generated" : "Full name"}
            />
          </Field>
          <div className="flex items-end">
            <Checkbox
              checked={form.anonymous}
              onCheckedChange={(v) => set("anonymous", v)}
              label="Anonymous record (privacy-by-default)"
            />
          </div>
        </div>
      </Section>

      {/* Section: travel */}
      <Section title="Origin & travel">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Origin country">
            <Input value={form.originCountry} onChange={(e) => set("originCountry", e.target.value)} />
          </Field>
          <Field label="Origin region">
            <Input value={form.originRegion} onChange={(e) => set("originRegion", e.target.value)} placeholder="e.g. Bundibugyo, Ituri" />
          </Field>
          <Field label="Destination">
            <Input value={form.destination} onChange={(e) => set("destination", e.target.value)} placeholder="e.g. Kampala" />
          </Field>
        </div>
        <Field label="Travel history — last 21 days (comma separated)">
          <Input value={form.travelHistory} onChange={(e) => set("travelHistory", e.target.value)} placeholder="e.g. Bunia, Goma, Kampala" />
        </Field>
      </Section>

      {/* Section: exposures */}
      <Section title="Exposures">
        <div className="grid md:grid-cols-3 gap-2">
          <Checkbox checked={form.contactWithCase} onCheckedChange={(v) => set("contactWithCase", v)} label="Contact with suspected/confirmed case" />
          <Checkbox checked={form.hcwExposure} onCheckedChange={(v) => set("hcwExposure", v)} label="Healthcare worker exposure" />
          <Checkbox checked={form.funeralExposure} onCheckedChange={(v) => set("funeralExposure", v)} label="Funeral / burial exposure" />
        </div>
      </Section>

      {/* Section: symptoms */}
      <Section title="Symptoms (reported)">
        <div className="grid md:grid-cols-3 gap-2">
          <Checkbox checked={form.fever} onCheckedChange={(v) => set("fever", v)} label="Fever" />
          <Checkbox checked={form.vomitingDiarrhea} onCheckedChange={(v) => set("vomitingDiarrhea", v)} label="Vomiting / diarrhea" />
          <Checkbox checked={form.unexplainedBleeding} onCheckedChange={(v) => set("unexplainedBleeding", v)} label="Unexplained bleeding" />
          <Checkbox checked={form.fatigue} onCheckedChange={(v) => set("fatigue", v)} label="Fatigue" />
          <Checkbox checked={form.headache} onCheckedChange={(v) => set("headache", v)} label="Headache" />
        </div>
      </Section>

      <Section title="Risk notes">
        <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Anything else of operational relevance." />
      </Section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          <Save className="h-4 w-4" />
          {submitting ? "Scoring…" : "Score & save"}
        </Button>
        <Link href="/dashboard/screenings">
          <Button type="button" variant="outline">Cancel</Button>
        </Link>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ScreeningResultPanel({
  result,
  subjectName,
}: {
  result: ResultState;
  subjectName: string;
}) {
  return (
    <div className="space-y-5 print-page" id="screening-result">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Screening recorded</h2>
          <p className="text-sm text-muted-foreground">
            Record <code className="text-primary">{result.id}</code> · subject {subjectName}
          </p>
        </div>
        <RiskPill risk={result.risk} />
      </div>

      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Recommended operational action</h3>
        </div>
        <p className="text-sm">{result.action}</p>
        <div className="text-xs text-muted-foreground">Operational risk score: <span className="font-bold tabular-nums text-foreground">{result.score}</span></div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-2">How this risk tier was determined</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {result.rationale.map((r, i) => (
            <li key={i}>• {r}</li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground mt-3">
          Operational triage tier only. Not a diagnosis. Clinical decisions are
          the responsibility of qualified health authorities.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 no-print">
        <Button onClick={() => window.print()} variant="outline">
          <Printer className="h-4 w-4" /> Print / share
        </Button>
        <Link href={`/dashboard/screenings/${result.id}`}>
          <Button variant="outline">View record</Button>
        </Link>
        <Link href="/dashboard/screenings/new">
          <Button>Record another</Button>
        </Link>
      </div>
    </div>
  );
}
