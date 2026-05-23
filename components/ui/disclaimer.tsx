import { AlertTriangle, ShieldCheck } from "lucide-react";

export function NotADiagnosticBanner() {
  return (
    <div className="flex items-start gap-3 rounded-md border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10 p-3 text-xs text-[hsl(var(--warning))]">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-semibold uppercase tracking-wide">
          Not a diagnostic device
        </p>
        <p className="text-[hsl(var(--warning))]/90">
          OutbreakOS supports operational screening, monitoring, logistics, and reporting workflows.
          It does not diagnose disease, determine infection status, or replace clinical judgment.
          Clinical decisions must be made by qualified health / public-health authorities.
        </p>
      </div>
    </div>
  );
}

export function DemoBanner() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--info))]/30 bg-[hsl(var(--info))]/10 px-3 py-2 text-xs text-[hsl(var(--info))]">
      <ShieldCheck className="h-4 w-4" />
      <span className="font-semibold uppercase tracking-wide">Demo data</span>
      <span className="text-[hsl(var(--info))]/80">
        Illustrative DRC / Uganda Bundibugyo 2026 scenario — not from any live incident.
      </span>
    </div>
  );
}

export function AIDisclaimer({ provider }: { provider?: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
      <strong className="text-foreground">Human review required.</strong> AI outputs (via{" "}
      <code>{provider || "deterministic fallback"}</code>) are advisory only and must be reviewed
      by qualified public-health authorities before any operational action.
    </div>
  );
}
