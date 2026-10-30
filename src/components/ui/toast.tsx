"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

type ToastInput = Omit<ToastItem, "id" | "kind">;
interface ToastApi {
  success(t: ToastInput | string): void;
  error(t: ToastInput | string): void;
  info(t: ToastInput | string): void;
}

const ToastContext = React.createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const counter = React.useRef(0);

  const dismiss = React.useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);

  const push = React.useCallback(
    (kind: ToastKind, input: ToastInput | string) => {
      const t = typeof input === "string" ? { title: input } : input;
      const id = ++counter.current;
      setItems((xs) => [...xs.slice(-2), { id, kind, ...t }]);
      setTimeout(() => dismiss(id), kind === "error" ? 6000 : 4000);
    },
    [dismiss],
  );

  const api = React.useMemo<ToastApi>(
    () => ({
      success: (t) => push("success", t),
      error: (t) => push("error", t),
      info: (t) => push("info", t),
    }),
    [push],
  );

  const icons = { success: CheckCircle2, error: AlertCircle, info: Info };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const Icon = icons[t.kind];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                role={t.kind === "error" ? "alert" : "status"}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-paper px-4 py-3 shadow-lift"
              >
                <Icon
                  className={cn(
                    "mt-0.5 size-[18px] shrink-0",
                    t.kind === "success" && "text-[#3E7A63]",
                    t.kind === "error" && "text-rose-deep",
                    t.kind === "info" && "text-burgundy",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-[13px] text-muted">{t.description}</p>}
                  {t.action && (
                    <button
                      className="mt-1.5 text-[13px] font-medium text-burgundy underline-offset-4 hover:underline"
                      onClick={() => {
                        t.action!.onClick();
                        dismiss(t.id);
                      }}
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button aria-label="Dismiss notification" onClick={() => dismiss(t.id)} className="text-muted hover:text-ink">
                  <X className="size-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
