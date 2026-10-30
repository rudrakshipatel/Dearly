import type { MetadataRoute } from "next";
import { occasions } from "@/lib/data/occasions";

const base = "https://dearly.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/explore", "/occasions", "/experiences", "/pricing", "/create", "/about", "/contact", "/help", "/privacy", "/terms"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...occasions.map((o) => ({ url: `${base}/occasions/${o.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
