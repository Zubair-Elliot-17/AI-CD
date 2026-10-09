// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import { useEffect, useState } from "react";
import { api, type Health } from "./api";

export type ServerState = "checking" | "waking" | "ready" | "offline";

const RETRY_MS = 5_000;
const GIVE_UP_MS = 4 * 60_000;

/** Polls /health until the model is up. Free-tier hosting sleeps, so the first hit can be slow. */
export function useServerStatus() {
  const [state, setState] = useState<ServerState>("checking");
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    const started = Date.now();
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let slowTimer: ReturnType<typeof setTimeout> | undefined = setTimeout(() => setState("waking"), 2_500);

    const poll = async () => {
      try {
        const h = await api.health(controller.signal);
        setHealth(h);
        if (h.status === "ok") {
          clearTimeout(slowTimer);
          setState("ready");
          return;
        }
        setState("waking");
      } catch {
        if (controller.signal.aborted) return;
        setState(Date.now() - started > GIVE_UP_MS ? "offline" : "waking");
      }
      clearTimeout(slowTimer);
      slowTimer = undefined;
      if (Date.now() - started <= GIVE_UP_MS) timer = setTimeout(poll, RETRY_MS);
    };
    poll();

    return () => {
      controller.abort();
      clearTimeout(timer);
      clearTimeout(slowTimer);
    };
  }, []);

  return { state, health };
}
