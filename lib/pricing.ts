// Shared pricing function — used by both the pricing page and the ROI
// calculator so the math always reconciles.

export type TierId = "industrial_site" | "multi_site" | "enterprise";

export interface Tier {
  id: TierId;
  name: string;
  perSiteAnnual?: number;
  perOrgMonthly?: number;
  enterpriseMin?: number;
  description: string;
}

export const TIERS: Tier[] = [
  {
    id: "industrial_site",
    name: "Industrial Site",
    perSiteAnnual: 60_000,
    description: "Per-site annual subscription. Best for 1-4 site deployments.",
  },
  {
    id: "multi_site",
    name: "Multi-Site Command",
    perOrgMonthly: 25_000,
    description: "Per-org monthly subscription. Best for cross-site responses up to ~10 sites.",
  },
  {
    id: "enterprise",
    name: "Government / Enterprise",
    enterpriseMin: 100_000,
    description: "Custom annual contract. Unlimited sites, integrations, SLAs.",
  },
];

export function recommendTier(sites: number): TierId {
  if (sites <= 4) return "industrial_site";
  if (sites <= 10) return "multi_site";
  return "enterprise";
}

export function annualCost(tierId: TierId, sites: number): number {
  const tier = TIERS.find((t) => t.id === tierId)!;
  if (tier.perSiteAnnual) return tier.perSiteAnnual * sites;
  if (tier.perOrgMonthly) return tier.perOrgMonthly * 12;
  return tier.enterpriseMin || 100_000;
}
