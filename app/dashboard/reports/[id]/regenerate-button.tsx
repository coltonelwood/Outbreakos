"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import type { ReportKind } from "@/lib/types";

export function RegenerateButton({ kind }: { kind: ReportKind }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function regenerate() {
    setBusy(true);
    const r = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    const j = await r.json();
    setBusy(false);
    if (r.ok && j.report) {
      router.push(`/dashboard/reports/${j.report.id}`);
      router.refresh();
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={regenerate} disabled={busy}>
      <Sparkles className="h-4 w-4" />
      {busy ? "Regenerating…" : "Regenerate"}
    </Button>
  );
}
