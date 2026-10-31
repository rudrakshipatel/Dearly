"use client";

import { Check, Globe, Minus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice, pricing } from "@/lib/data/pricing";
import { useUser } from "@/lib/hooks";
import { billingService } from "@/lib/services";
import type { PlanId, RegionCode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Select } from "../ui/form";
import { useToast } from "../ui/toast";
import { useDetectedRegion } from "./regional-price";

export function PricingTable() {
  const detected = useDetectedRegion();
  const [chosen, setRegion] = useState<RegionCode | null>(null);
  const region = chosen ?? detected;
  const [cycle, setCycle] = useState<"monthly" | "yearly">("yearly");
  const [busy, setBusy] = useState<PlanId | null>(null);
  const user = useUser();
  const toast = useToast();
  const router = useRouter();
  const r = pricing.regions.find((x) => x.code === region) ?? pricing.regions[0];
  const current = user?.plan ?? "free";

  const checkout = async (plan: PlanId) => {
    if (plan === "free") return;
    if (!user) {
      router.push(`/sign-up?next=${encodeURIComponent("/pricing")}`);
      return;
    }
    setBusy(plan);
    try {
      const result = await billingService.checkout({ kind: "subscription", plan, cycle }, region, "/account");
      // Razorpay completes in an overlay; access still only changes once the verified webhook arrives.
      if (result === "completed") router.push("/account?checkout=success");
    } catch (e) {
      toast.error({ title: "Checkout couldn't start", description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="mb-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <div className="inline-flex rounded-full border border-line bg-paper p-1" role="radiogroup" aria-label="Billing cycle">
          {(["monthly", "yearly"] as const).map((c) => (
            <button key={c} role="radio" aria-checked={cycle === c} onClick={() => setCycle(c)} className={cn("rounded-full px-4 py-1.5 text-[14px] capitalize transition-colors", cycle === c ? "bg-ink text-ivory" : "text-ink/70")}>
              {c}
              {c === "yearly" && <span className={cn("ml-1.5 text-[11px]", cycle === c ? "text-champagne" : "text-burgundy")}>save ~33%</span>}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[13px] text-muted">
          <Globe className="size-4" />
          <span className="sr-only">Region</span>
          <Select value={region} onChange={(e) => setRegion(e.target.value as RegionCode)} className="h-9 w-48 rounded-full text-[13px]">
            {pricing.regions.map((x) => (
              <option key={x.code} value={x.code}>
                {x.label} ({x.currency})
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {pricing.plans.map((plan) => {
          const price = plan.id === "free" ? null : r.prices[plan.id][cycle];
          const perMonth = price !== null && cycle === "yearly" ? price / 12 : price;
          const isCurrent = current === plan.id;
          return (
            <div key={plan.id} className={cn("relative flex flex-col rounded-[24px] border p-7", plan.featured ? "border-burgundy bg-burgundy text-ivory shadow-lift" : "border-line bg-paper")}>
              {plan.featured && <span className="absolute -top-3 left-7 rounded-full bg-champagne px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-burgundy">Most loved</span>}
              <h2 className="font-display text-3xl">{plan.name}</h2>
              <p className={cn("mt-1 text-[14px]", plan.featured ? "text-ivory/75" : "text-muted")}>{plan.tagline}</p>
              <p className="mt-6 font-display text-5xl leading-none">
                {perMonth === null ? "Free" : formatPrice(Math.round(perMonth * 100) / 100, r)}
                {perMonth !== null && <span className="font-sans text-[15px] opacity-70"> /month</span>}
              </p>
              <p className={cn("mt-2 h-5 text-[13px]", plan.featured ? "text-ivory/70" : "text-muted")}>
                {price !== null && cycle === "yearly" ? `${formatPrice(price, r)} billed yearly` : price !== null ? "Billed monthly · cancel anytime" : "Forever, for everyone"}
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-[14.5px]">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex gap-2.5">
                    <Check className={cn("mt-0.5 size-4 shrink-0", plan.featured ? "text-champagne" : "text-burgundy")} /> {h}
                  </li>
                ))}
              </ul>
              {plan.id === "free" ? (
                <Button asChild variant="outline" size="lg" className="mt-8 w-full">
                  <Link href="/create">{isCurrent && user ? "Your current plan" : plan.cta}</Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  className={cn("mt-8 w-full", plan.featured && "bg-ivory text-burgundy hover:bg-champagne")}
                  variant={plan.featured ? "primary" : "primary"}
                  disabled={isCurrent && !!user}
                  loading={busy === plan.id}
                  onClick={() => checkout(plan.id)}
                >
                  {isCurrent && user ? "Your current plan" : plan.cta}
                </Button>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-center text-[13px] text-muted">
        Prices shown in {r.currency}{r.code === "INTL" ? " for regions not listed" : ""}. Taxes may apply at checkout. Recipients never pay to open a card.
      </p>

      {/* Comparison */}
      <div className="mt-20">
        <h2 className="mb-6 text-center font-display text-4xl">Compare every feature</h2>
        <div className="overflow-x-auto rounded-[22px] border border-line bg-paper">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-line">
                <th className="px-5 py-4 font-normal text-muted" scope="col">
                  <span className="sr-only">Feature</span>
                </th>
                {pricing.plans.map((p) => (
                  <th key={p.id} scope="col" className="px-5 py-4 text-center font-display text-xl font-normal">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            {pricing.comparison.map((g) => (
              <tbody key={g.group}>
                <tr>
                  <th colSpan={4} scope="colgroup" className="bg-ivory px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                    {g.group}
                  </th>
                </tr>
                {g.rows.map((row) => (
                  <tr key={row.label} className="border-t border-line">
                    <th scope="row" className="px-5 py-3.5 font-normal text-ink/85">
                      {row.label}
                    </th>
                    {row.values.map((v, i) => (
                      <td key={i} className="px-5 py-3.5 text-center">
                        {v === true ? <Check className="mx-auto size-4 text-burgundy" aria-label="Included" /> : v === false ? <Minus className="mx-auto size-4 text-ink/25" aria-label="Not included" /> : <span className="text-ink/80">{v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </div>
    </div>
  );
}
