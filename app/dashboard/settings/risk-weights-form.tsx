"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { OrgSettings } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";

const FIELDS: { key: keyof OrgSettings["riskWeights"]; label: string; hint: string }[] = [
  { key: "fever", label: "Fever", hint: "Default +25" },
  { key: "bleeding", label: "Unexplained bleeding", hint: "Default +40" },
  { key: "contact", label: "Contact with suspected/confirmed case", hint: "Default +30" },
  { key: "hcw", label: "Healthcare worker exposure", hint: "Default +15" },
  { key: "funeral", label: "Funeral / burial exposure", hint: "Default +20" },
  { key: "travel", label: "Travel through active surveillance region", hint: "Default +20" },
];

export function RiskWeightsForm({
  initial,
  disabled,
}: {
  initial: OrgSettings["riskWeights"];
  disabled: boolean;
}) {
  const router = useRouter();
  const [w, setW] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const r = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ riskWeights: w }),
    });
    setSaving(false);
    if (r.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label>{f.label}</Label>
            <Input
              type="number"
              min={0}
              max={100}
              disabled={disabled}
              value={w[f.key]}
              onChange={(e) => setW({ ...w, [f.key]: Number(e.target.value) || 0 })}
            />
            <p className="text-[11px] text-muted-foreground">{f.hint}</p>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground bg-muted/30 border border-border rounded-md p-3">
        Thresholds (score → tier): 0–14 low · 15–39 monitor · 40–69 elevated · 70+ urgent.
        Adjust thresholds via support during pilot configuration.
      </div>
      {!disabled && (
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save weights"}
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-[hsl(var(--success))]">
              <CheckCircle2 className="h-4 w-4" /> Saved & audited
            </span>
          )}
        </div>
      )}
      {disabled && (
        <p className="text-xs text-muted-foreground">
          You don't have permission to change risk weights. Contact an admin or owner.
        </p>
      )}
    </div>
  );
}
