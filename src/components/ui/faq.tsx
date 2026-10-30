"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export function Faq({ items, className }: { items: { q: string; a: string }[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  const id = useId();
  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((it, i) => (
        <div key={it.q}>
          <h3>
            <button
              id={`${id}-q${i}`}
              aria-expanded={open === i}
              aria-controls={`${id}-a${i}`}
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-6 py-5 text-left text-[16px] text-ink"
            >
              {it.q}
              <Plus className={cn("size-4 shrink-0 text-muted transition-transform duration-300", open === i && "rotate-45")} />
            </button>
          </h3>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                id={`${id}-a${i}`}
                role="region"
                aria-labelledby={`${id}-q${i}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="max-w-2xl pb-5 text-[15px] leading-relaxed text-muted">{it.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
