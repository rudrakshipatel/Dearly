"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { ApiClientError, creationService } from "@/lib/services";
import type { Creation } from "@/lib/types";

export type SaveStatus = "saved" | "pending" | "saving" | "retrying" | "error" | "conflict";
type Phase = "idle" | "saving" | "retrying" | "error" | "conflict";

const DEBOUNCE_MS = 1200;
const backupKey = (id: string) => `dearly:backup:${id}`;

/** Only the content we persist — server bookkeeping (version, status, timestamps) is excluded. */
function contentKey(c: Creation) {
  const { title, pages, photos, interaction, message, recipientName, senderName, templateId, palette, occasion, experience, relationship, occasionDate } = c;
  return JSON.stringify({ title, pages, photos, interaction, message, recipientName, senderName, templateId, palette, occasion, experience, relationship, occasionDate });
}

interface Backup {
  doc: Creation;
  savedAt: string;
  baseVersion: number;
}

function readBackup(doc: Creation): Backup | null {
  try {
    const raw = localStorage.getItem(backupKey(doc.id));
    if (!raw) return null;
    const b = JSON.parse(raw) as Backup;
    if (b.baseVersion === (doc.version ?? 1) && contentKey(b.doc) !== contentKey(doc)) return b;
    localStorage.removeItem(backupKey(doc.id));
  } catch {}
  return null;
}

/**
 * Debounced autosave with optimistic concurrency:
 * - never saves on every keystroke; one request in flight at a time, newest content wins;
 * - a stale version is rejected by the server (409) instead of overwriting newer work;
 * - network failures retry with backoff; unsaved work is mirrored to localStorage for restoration.
 */
export function useAutosave(doc: Creation) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [savedContent, setSavedContent] = useState(() => contentKey(doc));
  const [restorable, setRestorable] = useState<Backup | null>(() => readBackup(doc));
  const key = useMemo(() => contentKey(doc), [doc]);

  const version = useRef(doc.version ?? 1);
  const latest = useRef({ doc, key });
  const saved = useRef(savedContent);
  const inflight = useRef<Promise<void> | null>(null);
  const again = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retries = useRef(0);
  const runRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    latest.current = { doc, key };
  }, [doc, key]);

  const run = useCallback(async (): Promise<void> => {
    if (inflight.current) {
      again.current = true;
      return inflight.current;
    }
    const { doc: sending, key: sendingKey } = latest.current;
    if (sendingKey === saved.current) {
      setPhase("idle");
      return;
    }
    setPhase("saving");
    inflight.current = (async () => {
      try {
        const card = await creationService.save(sending, version.current);
        version.current = card.version ?? version.current + 1;
        saved.current = sendingKey;
        setSavedContent(sendingKey);
        retries.current = 0;
        setMessage(null);
        setPhase("idle");
        if (latest.current.key === sendingKey) {
          try {
            localStorage.removeItem(backupKey(sending.id));
          } catch {}
        }
        track("card_saved", { source: "editor" });
      } catch (e) {
        if (e instanceof ApiClientError && e.code === "version_conflict") {
          setPhase("conflict");
          setMessage(e.message);
        } else if (e instanceof ApiClientError && e.status >= 400 && e.status < 500 && e.status !== 429) {
          setPhase("error");
          setMessage(e.message);
        } else {
          // Network or server hiccup: retry with backoff (2s, 4s, 8s … up to 30s).
          retries.current++;
          setPhase("retrying");
          setMessage(e instanceof Error ? e.message : "Connection lost.");
          timer.current = setTimeout(() => void runRef.current(), Math.min(30_000, 2000 * 2 ** (retries.current - 1)));
        }
      } finally {
        inflight.current = null;
      }
      if (again.current) {
        again.current = false;
        await runRef.current();
      }
    })();
    return inflight.current;
  }, []);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  // Debounce saves and keep a local backup of unsaved work.
  useEffect(() => {
    if (key === saved.current || phase === "conflict") return;
    try {
      localStorage.setItem(backupKey(doc.id), JSON.stringify({ doc, savedAt: new Date().toISOString(), baseVersion: version.current } satisfies Backup));
    } catch {}
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void run(), DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [doc, key, phase, run]);

  const status: SaveStatus = phase !== "idle" ? phase : key === savedContent ? "saved" : "pending";

  // Warn before leaving with unsaved changes (the local backup still protects against crashes).
  useEffect(() => {
    if (status === "saved") return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [status]);

  /** Saves immediately; resolves true when everything is stored. */
  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await run();
    if (inflight.current) await inflight.current;
    return latest.current.key === saved.current;
  }, [run]);

  /** After a conflict: keep this tab's version (overwrite) or load the newer one. */
  const resolveConflict = useCallback(
    async (keep: "mine" | "theirs") => {
      if (keep === "theirs") {
        try {
          localStorage.removeItem(backupKey(latest.current.doc.id));
        } catch {}
        window.location.reload();
        return;
      }
      const server = await creationService.get(latest.current.doc.id);
      version.current = server.version ?? version.current;
      setPhase("idle");
      await run();
    },
    [run],
  );

  const dismissRestore = useCallback(() => {
    try {
      localStorage.removeItem(backupKey(doc.id));
    } catch {}
    setRestorable(null);
  }, [doc.id]);

  return { status, message, flush, resolveConflict, restorable, dismissRestore, retryNow: run };
}
