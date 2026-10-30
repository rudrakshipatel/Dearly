"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { authService } from "../services";
import { mediaStore } from "../services/media";
import type { User } from "../types";

let cachedUserRaw: string | null = null;
let cachedUser: User | null = null;

function getUserSnapshot() {
  const raw = typeof window === "undefined" ? null : window.localStorage.getItem("dearly:session");
  if (raw !== cachedUserRaw) {
    cachedUserRaw = raw;
    try {
      cachedUser = raw ? (JSON.parse(raw) as User) : null;
    } catch {
      cachedUser = null;
    }
  }
  return cachedUser;
}

export function useUser() {
  return useSyncExternalStore(authService.subscribe, getUserSnapshot, () => null);
}

export function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Resolves `idb:` media references to object URLs; passes other URLs through. */
export function useMediaSrc(src?: string) {
  const isIdb = !!src?.startsWith("idb:");
  const [blob, setBlob] = useState<{ key: string; url: string } | null>(null);
  useEffect(() => {
    if (!src || !isIdb) return;
    let url: string | undefined;
    let cancelled = false;
    mediaStore.get(src.slice(4)).then((b) => {
      if (cancelled || !b) return;
      url = URL.createObjectURL(b);
      setBlob({ key: src, url });
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src, isIdb]);
  if (!isIdb) return src;
  return blob && blob.key === src ? blob.url : undefined;
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Current time, ticking every `intervalMs`. `null` during server rendering. */
export function useNow(intervalMs = 60_000) {
  return useSyncExternalStore(
    useCallback(
      (cb: () => void) => {
        const t = setInterval(cb, intervalMs);
        return () => clearInterval(t);
      },
      [intervalMs],
    ),
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => null,
  );
}
