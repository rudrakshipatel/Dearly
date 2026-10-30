/**
 * Tiny localStorage wrapper with change notifications, used by the mock services.
 * Prompt 2 replaces the services (not this file's callers) with real backend calls.
 */
type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

export const PREFIX = "dearly:";

export function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export class StorageFullError extends Error {
  constructor() {
    super("Your browser storage is full. Try removing a few photos or old drafts.");
  }
}

export function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    if (e instanceof DOMException) throw new StorageFullError();
    throw e;
  }
  listeners.get(key)?.forEach((l) => l());
}

export function subscribe(key: string, listener: Listener) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PREFIX + key) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.get(key)?.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Simulated network latency so loading states are visible and realistic. */
export function latency(ms = 280) {
  return new Promise((r) => setTimeout(r, ms));
}
