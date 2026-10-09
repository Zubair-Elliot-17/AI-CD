// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import clsx from "clsx";
import type { ServerState } from "../lib/useServerStatus";

const COPY: Record<ServerState, string> = {
  checking: "Connecting to model…",
  waking: "Waking the model server. Free hosting sleeps when idle, so this can take a minute.",
  ready: "Model ready",
  offline: "Model server is unreachable right now.",
};

export function ServerStatus({ state }: { state: ServerState }) {
  return (
    <p role="status" className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
      <span
        className={clsx(
          "size-2 shrink-0 rounded-full",
          state === "ready" && "bg-emerald-500",
          (state === "checking" || state === "waking") && "animate-pulse bg-amber-400",
          state === "offline" && "bg-rose-500",
        )}
      />
      {COPY[state]}
    </p>
  );
}
