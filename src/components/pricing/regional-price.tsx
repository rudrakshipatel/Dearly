"use client";

import { useSyncExternalStore } from "react";
import { formatPrice, pricing } from "@/lib/data/pricing";
import { billingService } from "@/lib/services";
import type { PlanId, RegionCode } from "@/lib/types";

/** Shows a plan price in the visitor's region once mounted (US pricing during prerender). */
export function RegionalPrice({ plan, cycle = "monthly" }: { plan: Exclude<PlanId, "free">; cycle?: "monthly" | "yearly" }) {
  const code = useDetectedRegion();
  const region = pricing.regions.find((r) => r.code === code) ?? pricing.regions[0];
  return <>{formatPrice(region.prices[plan][cycle], region)}</>;
}

const noop = () => () => {};

/** The visitor's region from their browser locale (US during server rendering). */
export function useDetectedRegion(): RegionCode {
  return useSyncExternalStore(noop, billingService.detectRegion, () => "US");
}
