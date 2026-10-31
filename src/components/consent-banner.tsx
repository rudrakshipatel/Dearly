"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { analyticsAvailable, getConsent, setConsent, subscribeConsent } from "@/lib/analytics";
import { Button } from "./ui/button";

/** Asks before loading analytics. Declining is as easy as accepting; essential cookies (sign-in) need no consent. */
export function ConsentBanner() {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, () => "pending" as const);
  const pathname = usePathname();
  const show = analyticsAvailable() && consent === null && !pathname.startsWith("/card/");
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-label="Analytics cookies"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-lg rounded-2xl border border-line bg-paper p-5 shadow-lift sm:left-6 sm:right-auto"
        >
          <p className="text-[14px] leading-relaxed text-ink/85">
            May we use anonymous analytics to improve Dearly? We never record your messages, names or photos.{" "}
            <Link href="/privacy" className="text-burgundy underline underline-offset-2">
              Privacy
            </Link>
          </p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setConsent("denied")}>
              No thanks
            </Button>
            <Button size="sm" onClick={() => setConsent("granted")}>
              Allow analytics
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
