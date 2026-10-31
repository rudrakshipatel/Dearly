import type { PlanId, RegionCode } from "../types";

/**
 * Regional price points are set explicitly per region (never converted at runtime),
 * so finance can tune them independently. Prompt 2 can load this from the billing provider.
 */
export interface RegionPricing {
  code: RegionCode;
  label: string;
  currency: string;
  locale: string;
  prices: Record<Exclude<PlanId, "free">, { monthly: number; yearly: number }>;
  /** One-time products, in major units. */
  oneTime: Record<"premium_card" | "group_card" | "special_experience", number>;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  highlights: string[];
  cta: string;
  featured?: boolean;
}

export const pricing: { regions: RegionPricing[]; plans: Plan[]; comparison: { group: string; rows: { label: string; values: [string | boolean, string | boolean, string | boolean] }[] }[] } = {
  regions: [
    { code: "US", label: "United States", currency: "USD", locale: "en-US", prices: { premium: { monthly: 5.99, yearly: 47.99 }, pro: { monthly: 11.99, yearly: 95.99 } }, oneTime: { premium_card: 2.99, group_card: 4.99, special_experience: 3.99 } },
    { code: "GB", label: "United Kingdom", currency: "GBP", locale: "en-GB", prices: { premium: { monthly: 4.99, yearly: 39.99 }, pro: { monthly: 9.99, yearly: 79.99 } }, oneTime: { premium_card: 2.49, group_card: 3.99, special_experience: 2.99 } },
    { code: "CA", label: "Canada", currency: "CAD", locale: "en-CA", prices: { premium: { monthly: 7.99, yearly: 63.99 }, pro: { monthly: 15.99, yearly: 127.99 } }, oneTime: { premium_card: 3.99, group_card: 6.49, special_experience: 4.99 } },
    { code: "AU", label: "Australia", currency: "AUD", locale: "en-AU", prices: { premium: { monthly: 8.99, yearly: 71.99 }, pro: { monthly: 17.99, yearly: 143.99 } }, oneTime: { premium_card: 4.49, group_card: 7.49, special_experience: 5.99 } },
    { code: "NZ", label: "New Zealand", currency: "NZD", locale: "en-NZ", prices: { premium: { monthly: 9.99, yearly: 79.99 }, pro: { monthly: 19.99, yearly: 159.99 } }, oneTime: { premium_card: 4.99, group_card: 7.99, special_experience: 5.99 } },
    { code: "IN", label: "India", currency: "INR", locale: "en-IN", prices: { premium: { monthly: 199, yearly: 1599 }, pro: { monthly: 449, yearly: 3599 } }, oneTime: { premium_card: 99, group_card: 199, special_experience: 149 } },
    { code: "INTL", label: "Everywhere else", currency: "USD", locale: "en-US", prices: { premium: { monthly: 4.99, yearly: 39.99 }, pro: { monthly: 9.99, yearly: 79.99 } }, oneTime: { premium_card: 2.49, group_card: 3.99, special_experience: 2.99 } },
  ],
  plans: [
    {
      id: "free",
      name: "Free",
      tagline: "Everything you need to make someone smile.",
      highlights: ["Basic templates", "Text customization", "Up to 3 photos per card", "Basic interactive experiences", "Shareable links"],
      cta: "Start for free",
    },
    {
      id: "premium",
      name: "Premium",
      tagline: "For the moments that deserve a little more.",
      highlights: ["All premium templates", "Advanced animations", "Up to 30 photos per card", "Video and audio greetings", "Premium experiences", "No Dearly branding"],
      cta: "Go Premium",
      featured: true,
    },
    {
      id: "pro",
      name: "Pro",
      tagline: "For planners, families and teams.",
      highlights: ["Everything in Premium", "Advanced editing tools", "AI writing assistance", "50 GB of storage", "Scheduled experiences", "Up to 1,000 live cards"],
      cta: "Go Pro",
    },
  ],
  comparison: [
    {
      group: "Creating",
      rows: [
        { label: "Templates", values: ["Basic", "All", "All"] },
        { label: "Photos per card", values: ["3", "30", "100"] },
        { label: "Pages per card", values: ["3", "12", "30"] },
        { label: "Advanced editing (layers, effects, frames)", values: [false, true, true] },
        { label: "AI writing assistance", values: [false, false, true] },
      ],
    },
    {
      group: "Experiences",
      rows: [
        { label: "The Letter & The Surprise", values: [true, true, true] },
        { label: "The Reveal (scratch, flip, balloons)", values: ["Basic", true, true] },
        { label: "The Memories scrapbook", values: ["1 page", true, true] },
        { label: "The Together group cards", values: ["5 signers", "50 signers", "1,000 signers"] },
        { label: "Video and audio", values: [false, true, true] },
      ],
    },
    {
      group: "Sharing",
      rows: [
        { label: "Shareable links", values: [true, true, true] },
        { label: "Scheduled delivery", values: [false, false, true] },
        { label: "Remove Dearly branding", values: [false, true, true] },
        { label: "Storage", values: ["500 MB", "10 GB", "50 GB"] },
      ],
    },
  ],
};

export function formatPrice(amount: number, region: RegionPricing) {
  return new Intl.NumberFormat(region.locale, {
    style: "currency",
    currency: region.currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
