// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import { useSyncExternalStore } from "react";
import type { DetectResult } from "./api";

// History lives only in this browser; the server keeps nothing.
export interface HistoryEntry extends DetectResult {
  created_at: string;
}

const KEY = "aicd-history-v2";
const MAX_ENTRIES = 30;
const listeners = new Set<() => void>();
let cache: HistoryEntry[] | null = null;

function read(): HistoryEntry[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(entries: HistoryEntry[]) {
  cache = entries;
  // Drop the oldest entries until it fits in the storage quota.
  for (let list = entries; list.length; list = list.slice(0, -1)) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      break;
    } catch {
      /* quota exceeded or storage blocked */
    }
  }
  listeners.forEach((fn) => fn());
}

export const history = {
  list: read,
  get: (id: string) => read().find((e) => e.id === id),
  add(result: DetectResult) {
    const entry = { ...result, created_at: new Date().toISOString() };
    write([entry, ...read().filter((e) => e.id !== result.id)].slice(0, MAX_ENTRIES));
  },
  remove(id: string) {
    write(read().filter((e) => e.id !== id));
  },
  clear() {
    write([]);
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        cache = null;
        fn();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(fn);
      window.removeEventListener("storage", onStorage);
    };
  },
  /** Test helper. */
  _reset() {
    cache = null;
  },
};

export function useHistory(): HistoryEntry[] {
  return useSyncExternalStore(history.subscribe, history.list, () => []);
}
