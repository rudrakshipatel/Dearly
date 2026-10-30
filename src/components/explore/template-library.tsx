"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { categories } from "@/lib/data/experiences";
import { occasions } from "@/lib/data/occasions";
import { templates } from "@/lib/data/templates";
import type { OccasionSlug, Template, TemplateCategory, TemplateStyle } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TemplateCard } from "../templates/template-card";
import { Button } from "../ui/button";
import { Chip, EmptyState } from "../ui/misc";
import { Select } from "../ui/form";

const styles: TemplateStyle[] = ["minimal", "romantic", "elegant", "playful", "vintage", "modern", "floral", "scrapbook", "editorial", "festive"];

type Sort = "popular" | "recent";
type Price = "all" | "free" | "premium";
type Kind = "all" | "interactive" | "static";
type Photos = "any" | "none" | "few" | "many";

export function TemplateLibrary({ lockedOccasion, title }: { lockedOccasion?: OccasionSlug; title?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(params.get("q") ?? "");
  // Occasion and category live in the URL so links like /explore?category=love-letters just work.
  const occasion = (lockedOccasion ?? (params.get("occasion") || "all")) as OccasionSlug | "all";
  const category = (params.get("category") || "all") as TemplateCategory | "all";
  const [style, setStyle] = useState<TemplateStyle | "all">("all");
  const [price, setPrice] = useState<Price>("all");
  const [kind, setKind] = useState<Kind>("all");
  const [photos, setPhotos] = useState<Photos>("any");
  const [sort, setSort] = useState<Sort>("popular");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const syncUrl = (next: Record<string, string>) => {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => (v && v !== "all" ? sp.set(k, v) : sp.delete(k)));
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = templates.filter((t: Template) => {
      if (occasion !== "all" && t.occasion !== occasion) return false;
      if (category !== "all" && t.category !== category) return false;
      if (style !== "all" && t.style !== style) return false;
      if (price === "free" && t.premium) return false;
      if (price === "premium" && !t.premium) return false;
      if (kind === "interactive" && !t.interactive) return false;
      if (kind === "static" && t.interactive) return false;
      if (photos === "none" && t.photoSlots > 0) return false;
      if (photos === "few" && (t.photoSlots < 1 || t.photoSlots > 3)) return false;
      if (photos === "many" && t.photoSlots < 4) return false;
      if (q) {
        const hay = `${t.name} ${t.description} ${t.style} ${t.occasion} ${t.category} ${t.headline}`.toLowerCase();
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    return list.sort((a, b) => (sort === "popular" ? b.popularity - a.popularity : b.addedAt.localeCompare(a.addedAt)));
  }, [query, occasion, category, style, price, kind, photos, sort]);

  const activeCount = [style !== "all", price !== "all", kind !== "all", photos !== "any", !lockedOccasion && occasion !== "all"].filter(Boolean).length;

  const reset = () => {
    setQuery("");
    setStyle("all");
    setPrice("all");
    setKind("all");
    setPhotos("any");
    syncUrl({ q: "", occasion: "all", category: "all" });
  };

  const filterPanel = (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
      {!lockedOccasion && (
        <FilterSelect label="Occasion" value={occasion} onChange={(v) => syncUrl({ occasion: v })}>
          <option value="all">All occasions</option>
          {occasions.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.name}
            </option>
          ))}
        </FilterSelect>
      )}
      <FilterSelect label="Style" value={style} onChange={(v) => setStyle(v as TemplateStyle | "all")}>
        <option value="all">Any style</option>
        {styles.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s[0].toUpperCase() + s.slice(1)}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect label="Price" value={price} onChange={(v) => setPrice(v as Price)}>
        <option value="all">Free & Premium</option>
        <option value="free">Free only</option>
        <option value="premium">Premium only</option>
      </FilterSelect>
      <FilterSelect label="Type" value={kind} onChange={(v) => setKind(v as Kind)}>
        <option value="all">Interactive & static</option>
        <option value="interactive">Interactive</option>
        <option value="static">Static</option>
      </FilterSelect>
      <FilterSelect label="Photos" value={photos} onChange={(v) => setPhotos(v as Photos)}>
        <option value="any">Any number</option>
        <option value="none">No photos</option>
        <option value="few">1–3 photos</option>
        <option value="many">4+ photos</option>
      </FilterSelect>
    </div>
  );

  return (
    <div>
      {/* Search + controls */}
      <div className="sticky top-16 z-20 -mx-5 border-b border-line bg-ivory/90 px-5 py-3 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="flex items-center gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Search templates</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => syncUrl({ q: query })}
              placeholder={title ?? "Search letters, birthdays, scratch cards…"}
              className="h-11 w-full rounded-full border border-line bg-paper pl-10 pr-10 text-[15px] focus:border-burgundy/40 focus:outline-none focus:ring-4 focus:ring-blush"
              type="search"
            />
            {query && (
              <button aria-label="Clear search" onClick={() => { setQuery(""); syncUrl({ q: "" }); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                <X className="size-4" />
              </button>
            )}
          </label>
          <Button variant="outline" className="h-11" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
            <SlidersHorizontal /> <span className="hidden sm:inline">Filters</span>
            {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-burgundy text-[11px] text-ivory">{activeCount}</span>}
          </Button>
          <Select aria-label="Sort templates" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="hidden h-11 w-40 rounded-full sm:block">
            <option value="popular">Most popular</option>
            <option value="recent">Recently added</option>
          </Select>
        </div>
        <div className="scrollbar-none -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <Chip active={category === "all"} onClick={() => syncUrl({ category: "all" })}>
            All experiences
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={category === c.id} onClick={() => syncUrl({ category: c.id })}>
              {c.name}
            </Chip>
          ))}
        </div>
        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pb-2 pt-5">
                {filterPanel}
                <div className="mt-4 flex items-center justify-between sm:hidden">
                  <Select aria-label="Sort templates" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 w-44">
                    <option value="popular">Most popular</option>
                    <option value="recent">Recently added</option>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-between text-[14px] text-muted">
        <p aria-live="polite">
          {results.length} {results.length === 1 ? "template" : "templates"}
        </p>
        {(activeCount > 0 || query || category !== "all") && (
          <button onClick={reset} className="text-burgundy underline-offset-4 hover:underline">
            Clear all
          </button>
        )}
      </div>

      {results.length ? (
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {results.map((t, i) => (
            <TemplateCard key={t.id} template={t} priority={i < 8} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-6"
          title="Nothing quite like that — yet"
          description="Try a different search or loosen a filter. New templates arrive every week."
          action={<Button onClick={reset}>Clear filters</Button>}
        />
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className={cn("block")}>
      <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-wider text-muted">{label}</span>
      <Select value={value} onChange={(e) => onChange(e.target.value)} className="h-10">
        {children}
      </Select>
    </label>
  );
}
