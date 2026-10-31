"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useResolvedSrc } from "../media/resolver";
import { authService, type Me } from "../services";
import { supabaseBrowser } from "../supabase/client";
import type { User } from "../types";

/* ------------------------------------------------------------------ session store */

type SessionState = { status: "loading" | "ready"; user: User | null; me: Me | null };
let state: SessionState = { status: "loading", user: null, me: null };
const subs = new Set<() => void>();
let started = false;

function set(next: SessionState) {
  state = next;
  subs.forEach((s) => s());
}

async function loadMe() {
  try {
    const me = await authService.me();
    set({
      status: "ready",
      me,
      user: { id: me.user.id, email: me.user.email, name: me.profile?.display_name || me.user.email.split("@")[0], plan: me.plan, verified: me.user.verified, isAdmin: me.isAdmin },
    });
  } catch {
    set({ status: "ready", user: null, me: null });
  }
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  supabaseBrowser().auth.onAuthStateChange((event, session) => {
    if (!session) set({ status: "ready", user: null, me: null });
    else if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "USER_UPDATED") void loadMe();
  });
}

/** Re-fetches plan/usage after a change (e.g. checkout or publish). */
export function refreshSession() {
  return loadMe();
}

function subscribe(cb: () => void) {
  start();
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}

const serverState: SessionState = { status: "loading", user: null, me: null };

export function useSession() {
  return useSyncExternalStore(subscribe, () => state, () => serverState);
}

export function useUser() {
  return useSession().user;
}

export function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Resolves card media (`media:`/`path:`/`scene:`/URLs) to a loadable URL. */
export function useMediaSrc(src?: string, variant: "full" | "thumb" = "full") {
  return useResolvedSrc(src, variant);
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
