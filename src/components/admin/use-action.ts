"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "../ui/toast";

/** Runs a server action, reports the result and refreshes the server-rendered data. */
export function useAdminAction() {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, ok = "Saved.") =>
    new Promise<boolean>((resolve) =>
      start(async () => {
        const r = await fn();
        if (r.ok) {
          toast.success(ok);
          router.refresh();
        } else toast.error(r.error);
        resolve(r.ok);
      }),
    );
  return { run, pending };
}
