"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Resolves `media:<id>` references to short-lived signed URLs, batching every request made in the
 * same tick into one /api/media/sign call. Public cards pass their slug; the editor signs as the owner.
 */
type Entry = { url: string; thumbUrl: string | null; expires: number };
const cache = new Map<string, Entry>();
const pending = new Map<string, Set<string>>();
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const key = (scope: string, id: string) => `${scope}|${id}`;

function flush(scope: string) {
  timers.delete(scope);
  const ids = Array.from(pending.get(scope) ?? []);
  pending.delete(scope);
  if (!ids.length) return;
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    fetch("/api/media/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: chunk.filter((x) => !x.startsWith("path:")),
        paths: chunk.filter((x) => x.startsWith("path:")).map((x) => x.slice(5)),
        slug: scope === "owner" ? undefined : scope,
      }),
    })
      .then((r) => (r.ok ? r.json() : { urls: {}, expiresIn: 0 }))
      .then((data: { urls: Record<string, { url: string; thumbUrl: string | null }>; expiresIn: number }) => {
        const expires = Date.now() + Math.max(60, (data.expiresIn ?? 3600) - 120) * 1000;
        for (const [id, v] of Object.entries(data.urls ?? {})) cache.set(key(scope, id), { ...v, expires });
        listeners.forEach((l) => l());
      })
      .catch(() => {});
  }
}

function request(scope: string, id: string) {
  if (!pending.has(scope)) pending.set(scope, new Set());
  pending.get(scope)!.add(id);
  if (!timers.has(scope)) timers.set(scope, setTimeout(() => flush(scope), 0));
}

export function lookupMedia(scope: string, id: string): Entry | undefined {
  const e = cache.get(key(scope, id));
  if (e && e.expires > Date.now()) return e;
  request(scope, id);
  return undefined;
}

/** Seeds the cache with a URL we already have (e.g. a local preview right after upload). */
export function primeMedia(scope: string, id: string, url: string) {
  cache.set(key(scope, id), { url, thumbUrl: null, expires: Date.now() + 30 * 60 * 1000 });
  listeners.forEach((l) => l());
}

const MediaScope = createContext<string>("owner");

export function MediaScopeProvider({ slug, children }: { slug?: string; children: React.ReactNode }) {
  return <MediaScope value={slug ?? "owner"}>{children}</MediaScope>;
}

export function useMediaScope() {
  return useContext(MediaScope);
}

/** Resolves a card media src (`media:…`, `scene:…`, https or blob URL) to something an <img>/<video> can load. */
export function useResolvedSrc(src: string | undefined, variant: "full" | "thumb" = "full") {
  const scope = useMediaScope();
  const [, force] = useState(0);
  // `media:<id>` for uploaded media; `path:<storage path>` for group-card contribution files.
  const id = src?.startsWith("media:") ? src.slice(6) : src?.startsWith("path:") ? src : null;
  useEffect(() => {
    if (!id) return;
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [id]);
  if (!src) return undefined;
  if (!id) return src;
  const e = lookupMedia(scope, id);
  return variant === "thumb" ? (e?.thumbUrl ?? e?.url) : e?.url;
}
