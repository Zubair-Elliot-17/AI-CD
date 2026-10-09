// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import { useEffect, useState, useSyncExternalStore } from "react";
import { api, API_URL } from "./api";
import { engine, LIMITS, type EngineStatus } from "./engine";

export type ModelState =
  | { state: "checking" | "waking" | "ready" | "offline" }
  | { state: "downloading"; loaded: number; total: number };

export type Limits = { min_words: number; max_chars: number; max_file_bytes: number };

const RETRY_MS = 5_000;
const GIVE_UP_MS = 4 * 60_000;

function fromEngine(s: EngineStatus): ModelState {
  if (s.state === "loading") return { state: "downloading", loaded: s.loaded, total: s.total };
  if (s.state === "error") return { state: "offline" };
  return { state: s.state === "ready" ? "ready" : "checking" };
}

/** Browser mode: starts the model download. Server mode: polls /health until the model is up. */
export function useModelStatus(): { status: ModelState; limits: Limits } {
  const local = useSyncExternalStore(engine.subscribe, () => engine.status);
  const [status, setStatus] = useState<ModelState>({ state: "checking" });
  const [limits, setLimits] = useState<Limits>(LIMITS);

  useEffect(() => {
    if (!API_URL) {
      engine.load();
      return;
    }

    const started = Date.now();
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Free-tier hosting sleeps, so the first hit can be slow.
    const slowTimer = setTimeout(() => setStatus({ state: "waking" }), 2_500);

    const poll = async () => {
      try {
        const h = await api.health(controller.signal);
        setLimits(h);
        if (h.status === "ok") {
          clearTimeout(slowTimer);
          setStatus({ state: "ready" });
          return;
        }
        setStatus({ state: "waking" });
      } catch {
        if (controller.signal.aborted) return;
        setStatus({ state: Date.now() - started > GIVE_UP_MS ? "offline" : "waking" });
      }
      clearTimeout(slowTimer);
      if (Date.now() - started <= GIVE_UP_MS) timer = setTimeout(poll, RETRY_MS);
    };
    poll();

    return () => {
      controller.abort();
      clearTimeout(timer);
      clearTimeout(slowTimer);
    };
  }, []);

  return API_URL ? { status, limits } : { status: fromEngine(local), limits: LIMITS };
}
