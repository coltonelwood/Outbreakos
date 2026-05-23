import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down" | "flat";
  icon?: React.ReactNode;
  intent?: "default" | "warning" | "critical" | "success";
  hint?: string;
}

const intents: Record<NonNullable<StatCardProps["intent"]>, string> = {
  default: "border-border",
  warning: "border-[hsl(var(--warning))]/40 bg-[hsl(var(--warning))]/5",
  critical: "border-destructive/40 bg-destructive/5",
  success: "border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/5",
};

export function StatCard({ label, value, delta, trend = "flat", icon, intent = "default", hint }: StatCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <div className={cn("rounded-lg border bg-card p-4 transition-colors", intents[intent])}>
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums">{value}</div>
      {(delta || hint) && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          {delta && (
            <>
              <TrendIcon
                className={cn(
                  "h-3 w-3",
                  trend === "up" && "text-destructive",
                  trend === "down" && "text-[hsl(var(--success))]",
                )}
              />
              <span>{delta}</span>
            </>
          )}
          {hint && <span className="ml-auto">{hint}</span>}
        </div>
      )}
    </div>
  );
}
