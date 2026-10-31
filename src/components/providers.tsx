"use client";

import { MotionConfig } from "framer-motion";
import { Suspense } from "react";
import { ConsentBanner } from "./consent-banner";
import { ToastProvider } from "./ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        {children}
        <Suspense fallback={null}>
          <ConsentBanner />
        </Suspense>
      </ToastProvider>
    </MotionConfig>
  );
}
