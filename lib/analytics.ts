// Real, org-scoped analytics computed from actual records. No hardcoded
// demo numbers leak into a tenant's dashboard.

import type { ScreeningRecord, Risk } from "./types";

export interface TimeseriesPoint {
  date: string;
  screenings: number;
  flagged: number;
}

const RISK_COLORS: Record<Risk, string> = {
  low: "hsl(142 70% 45%)",
  monitor: "hsl(199 89% 48%)",
  elevated: "hsl(38 92% 50%)",
  urgent: "hsl(0 84% 60%)",
};

// 14-day screening volume from the org's own screenings.
export function screeningTimeseries(screenings: ScreeningRecord[], days = 14): TimeseriesPoint[] {
  const buckets = new Map<string, { screenings: number; flagged: number }>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000).toISOString().slice(5, 10);
    buckets.set(d, { screenings: 0, flagged: 0 });
  }
  for (const s of screenings) {
    const key = s.createdAt.slice(5, 10);
    const b = buckets.get(key);
    if (!b) continue;
    b.screenings += 1;
    if (s.risk !== "low") b.flagged += 1;
  }
  return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));
}

export function riskBreakdown(screenings: ScreeningRecord[]) {
  const counts: Record<Risk, number> = { low: 0, monitor: 0, elevated: 0, urgent: 0 };
  for (const s of screenings) counts[s.risk] += 1;
  return (Object.keys(counts) as Risk[])
    .filter((k) => counts[k] > 0)
    .map((k) => ({
      name: k.charAt(0).toUpperCase() + k.slice(1),
      value: counts[k],
      fill: RISK_COLORS[k],
    }));
}

export function hasScreeningActivity(screenings: ScreeningRecord[]): boolean {
  return screenings.length > 0;
}
