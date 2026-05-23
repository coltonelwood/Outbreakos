import { cn } from "@/lib/utils";
import type { Risk, Severity, ContactStatus, AlertStatus } from "@/lib/types";

const riskStyles: Record<Risk, string> = {
  low: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
  monitor: "bg-[hsl(var(--info))]/15 text-[hsl(var(--info))]",
  elevated: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
  urgent: "bg-destructive/15 text-destructive",
};

const sevStyles: Record<Severity, string> = {
  info: "bg-[hsl(var(--info))]/15 text-[hsl(var(--info))]",
  warning: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
  high: "bg-orange-500/15 text-orange-400",
  critical: "bg-destructive/15 text-destructive",
};

const contactStyles: Record<ContactStatus, string> = {
  active: "bg-[hsl(var(--info))]/15 text-[hsl(var(--info))]",
  cleared: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
  escalated: "bg-destructive/15 text-destructive",
  lost_to_follow_up: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
};

const alertStyles: Record<AlertStatus, string> = {
  open: "bg-destructive/15 text-destructive",
  ack: "bg-[hsl(var(--info))]/15 text-[hsl(var(--info))]",
  resolved: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
};

export function RiskPill({ risk }: { risk: Risk }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        riskStyles[risk],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {risk}
    </span>
  );
}

export function SeverityPill({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        sevStyles[severity],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {severity}
    </span>
  );
}

export function ContactStatusPill({ status }: { status: ContactStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        contactStyles[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function AlertStatusPill({ status }: { status: AlertStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase",
        alertStyles[status],
      )}
    >
      {status}
    </span>
  );
}
